"""Invite a registered student to the GitHub training team."""

import argparse
import contextlib
import csv
import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import logging
import os
from pathlib import Path
import re
import secrets
import sqlite3
import sys
import time
import unicodedata
from urllib.parse import urlsplit


REGISTER_PATH = "/api/github-onboarding/register-student"
TEAM_PATH = "/orgs/aust-robot-ai-training/teams/training-2026/memberships/"
RETRY_MESSAGE = "暂时无法确认邀请，请稍后用同一个用户名重试。"
STUDENT_FORMAT = "请填写专业、班级和姓名，例如计算机26-4王小明或计算机-26-4-王小明。"
CLASS_PATTERN = r"[^\W_]+(?:\s+[^\W_]+)*(?:\s*-\s*[0-9]{1,3})?"
DELIMITED_STUDENT = re.compile(r"([^-]+?)\s*-\s*(" + CLASS_PATTERN + r")\s*-\s*(.+)")
COMPACT_STUDENT = re.compile(r"(.+?)\s*([0-9]{2,4}\s*-\s*[0-9]{1,3})\s*(.+)")
DASHES = str.maketrans({char: "-" for char in "‐‑‒–—−"})


class Rejected(ValueError):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def normalize(value):
    if not isinstance(value, str) or len(value) > 250:
        raise Rejected(400, "请填写 GitHub 用户名或个人主页链接。")
    username = value.strip()
    if username.lower().startswith(("http://", "https://")):
        try:
            url = urlsplit(username)
            if url.netloc.lower() != "github.com" or not re.fullmatch(r"/[^/]+/?", url.path):
                raise ValueError
        except ValueError as error:
            raise Rejected(400, "请使用 github.com 上的个人主页链接。") from error
        username = url.path.strip("/")
    else:
        username = username.removeprefix("@")
    if not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?", username) or "--" in username:
        raise Rejected(400, "GitHub 用户名格式有误，请检查后再提交。")
    return username.lower()


def parse_student(value):
    if not isinstance(value, str) or not 0 < len(value) <= 96:
        raise Rejected(400, STUDENT_FORMAT)
    value = unicodedata.normalize("NFKC", value).translate(DASHES).strip()
    if any(unicodedata.category(char).startswith("C") for char in value):
        raise Rejected(400, STUDENT_FORMAT)
    match = DELIMITED_STUDENT.fullmatch(value) or COMPACT_STUDENT.fullmatch(value)
    if not match:
        raise Rejected(400, STUDENT_FORMAT)
    major, class_name, student_name = (" ".join(part.split()) for part in match.groups())
    class_name = re.sub(r"\s*-\s*", "-", class_name)
    if (
        not 1 <= len(major) <= 48 or not major[0].isalpha()
        or not all(char.isalnum() or char in " ()·&/" for char in major)
        or not 1 <= len(class_name) <= 24
        or not 1 <= len(student_name) <= 40 or not student_name[0].isalpha()
        or not all(unicodedata.category(char)[0] in "LM" or char in " ·.'’-" for char in student_name)
    ):
        raise Rejected(400, STUDENT_FORMAT)
    return major, class_name, student_name


@contextlib.contextmanager
def database(path):
    with contextlib.closing(sqlite3.connect(path)) as connection, connection:
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        yield connection


def initialize(path):
    with database(path) as connection:
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("""
            CREATE TABLE IF NOT EXISTS registrations (
                username TEXT PRIMARY KEY NOT NULL,
                registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                state TEXT NOT NULL DEFAULT 'retry',
                lease_until INTEGER NOT NULL DEFAULT 0,
                lease_id TEXT
            )
        """)
        connection.execute("""
            CREATE TABLE IF NOT EXISTS student_profiles (
                username TEXT PRIMARY KEY NOT NULL REFERENCES registrations(username),
                major TEXT NOT NULL,
                class_name TEXT NOT NULL,
                student_name TEXT NOT NULL
            )
        """)
        connection.execute("""
            CREATE TABLE IF NOT EXISTS invitation_emails (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL REFERENCES registrations(username),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                next_attempt INTEGER NOT NULL DEFAULT 0,
                attempts INTEGER NOT NULL DEFAULT 0,
                sent_at TEXT
            )
        """)


def claim(path, username, student):
    now = int(time.time())
    lease_id = secrets.token_hex(16)
    with database(path) as connection:
        cursor = connection.execute("""
            INSERT INTO registrations (username, lease_until, lease_id) VALUES (?, ?, ?)
            ON CONFLICT(username) DO UPDATE SET
                lease_until = excluded.lease_until,
                lease_id = excluded.lease_id
            WHERE registrations.lease_until <= ?
        """, (username, now + 90, lease_id, now))
        if cursor.rowcount != 1:
            raise Rejected(409, "该账号的邀请正在处理，请稍后重试。")
        connection.execute("""
            INSERT INTO student_profiles (username, major, class_name, student_name)
            VALUES (?, ?, ?, ?) ON CONFLICT(username) DO NOTHING
        """, (username, *student))
        existing = connection.execute("""
            SELECT major, class_name, student_name FROM student_profiles WHERE username = ?
        """, (username,)).fetchone()
        if tuple(existing) != student:
            raise Rejected(409, "此 GitHub 账号已有登记。如需更正学员信息，请联系培训方。")
    return lease_id


def finish(path, username, lease_id, state, invitation_created):
    with database(path) as connection:
        cursor = connection.execute("""
            UPDATE registrations SET state = ?, lease_until = 0, lease_id = NULL
            WHERE username = ? AND lease_id = ?
        """, (state, username, lease_id))
        if cursor.rowcount != 1:
            raise Rejected(503, RETRY_MESSAGE)
        if invitation_created:
            connection.execute("INSERT INTO invitation_emails (username) VALUES (?)", (username,))


def github_client(token):
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "User-Agent": "win98-training-onboarding",
        "X-GitHub-Api-Version": "2026-03-10",
    }

    def request(method, path):
        with contextlib.closing(http.client.HTTPSConnection("api.github.com", timeout=6)) as client:
            body = b'{"role":"member"}' if method == "PUT" else None
            client.request(method, path, body=body, headers=headers)
            response = client.getresponse()
            raw = response.read(32_768) if response.status == 200 else b""
            return response.status, json.loads(raw) if raw else {}

    return request


def invite(github, username):
    endpoint = TEAM_PATH + username
    status, data = github("GET", endpoint)
    new_membership = status == 404
    if new_membership:
        status, data = github("PUT", endpoint)
    state = data.get("state") if isinstance(data, dict) else None
    if status != 200 or state not in ("pending", "active"):
        logging.warning("GitHub team membership request returned HTTP %s", status)
        raise Rejected(503, RETRY_MESSAGE)
    return state, new_membership and state == "pending"


def register(path, github, payload):
    if not isinstance(payload, dict) or payload.get("website"):
        raise Rejected(400, "提交格式有误，请刷新后重试。")
    username = normalize(payload.get("github_username"))
    student = parse_student(payload.get("student_info"))
    lease_id = claim(path, username, student)

    state = "retry"
    invitation_created = False
    try:
        state, invitation_created = invite(github, username)
    except (OSError, http.client.HTTPException, ValueError) as error:
        if not isinstance(error, Rejected):
            logging.warning("GitHub team membership request failed (%s)", type(error).__name__)
        raise Rejected(503, RETRY_MESSAGE) from error
    finally:
        finish(path, username, lease_id, state, invitation_created)

    # A visitor can submit any handle. Keep existing membership state in the private report.
    return {
        "github_username": username,
        "message": "GitHub 已确认登记。请登录你提交的账号，查看组织页面或在通知中接受邀请。",
    }


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, _format, *_args):
        # Do not log request contents, query strings or credentials.
        pass

    def send_json(self, status, body):
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/healthz":
            self.send_json(200, {"ok": True})
        else:
            self.send_json(404, {"error": "接口不存在。"})

    def do_POST(self):
        if self.path != REGISTER_PATH:
            self.send_json(404, {"error": "接口不存在。"})
            return
        try:
            body = self.read_registration()
            result = register(self.server.db_path, self.server.github, body)
        except Rejected as error:
            self.send_json(error.status, {"error": str(error)})
        except sqlite3.Error as error:
            logging.error("Registration database failure (%s)", type(error).__name__)
            self.send_json(503, {"error": RETRY_MESSAGE})
        else:
            self.send_json(200, result)

    def read_registration(self):
        if self.headers.get_all("Origin") != [self.server.origin]:
            raise Rejected(403, "请在培训教程页面提交。")
        if self.headers.get_content_type() != "application/json":
            raise Rejected(415, "请在培训教程页面提交。")
        lengths = self.headers.get_all("Content-Length")
        if self.headers.get("Transfer-Encoding") or not lengths or len(lengths) != 1:
            raise Rejected(400, "提交格式有误。")
        try:
            length = int(lengths[0])
            if not 0 < length <= 2048:
                raise Rejected(413, "提交内容过长或为空。")
            return json.loads(self.rfile.read(length))
        except Rejected:
            raise
        except (ValueError, TimeoutError, RecursionError) as error:
            raise Rejected(400, "提交格式有误，请刷新后重试。") from error


def make_server(port, origin, db_path, github):
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    server.origin = origin
    server.db_path = db_path
    server.github = github
    return server


def export_registrations(db_path, search, report):
    with database(db_path) as connection:
        rows = connection.execute("""
            SELECT r.username, r.state, r.registered_at, p.major, p.class_name, p.student_name
            FROM registrations AS r LEFT JOIN student_profiles AS p ON p.username = r.username
            WHERE instr(r.username, ?) > 0 ORDER BY r.username
        """, (search.lower(),)).fetchall()
    writer = csv.writer(sys.stdout)
    columns = ["github_username"]
    if report:
        columns.extend(["last_invite_state", "registered_at_utc", "major", "class_name", "student_name"])
    writer.writerow(columns)
    writer.writerows(tuple(row) if report else (row["username"],) for row in rows)


def set_student(path, username, student):
    with database(path) as connection:
        if not connection.execute("SELECT 1 FROM registrations WHERE username = ?", (username,)).fetchone():
            raise Rejected(404, "没有找到此 GitHub 用户名的登记。")
        connection.execute("""
            INSERT INTO student_profiles (username, major, class_name, student_name) VALUES (?, ?, ?, ?)
            ON CONFLICT(username) DO UPDATE SET major = excluded.major,
                class_name = excluded.class_name, student_name = excluded.student_name
        """, (username, *student))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=Path("/var/lib/win98-onboarding/registrations.sqlite3"))
    commands = parser.add_subparsers(dest="command", required=True)
    server = commands.add_parser("serve")
    server.add_argument("--port", type=int, default=18101)
    server.add_argument("--origin", default="https://win98.site")
    export = commands.add_parser("export")
    export.add_argument("--search", default="")
    export.add_argument("--report", action="store_true")
    correction = commands.add_parser("set-student")
    correction.add_argument("username")
    args = parser.parse_args()
    os.umask(0o077)
    logging.basicConfig(level=logging.INFO)

    initialize(args.db)
    if args.command == "export":
        export_registrations(args.db, args.search, args.report)
    elif args.command == "set-student":
        try:
            set_student(args.db, normalize(args.username), parse_student(input("专业、班级、姓名：")))
        except (Rejected, EOFError) as error:
            parser.error(str(error))
        print("学员信息已保存。")
    else:
        token = (Path(os.environ["CREDENTIALS_DIRECTORY"]) / "github-token").read_text().strip()
        if not re.fullmatch(r"github_pat_[A-Za-z0-9_]+", token):
            parser.error("configure a GitHub fine-grained personal access token")
        with make_server(args.port, args.origin, args.db, github_client(token)) as http_server:
            http_server.serve_forever()


if __name__ == "__main__":
    main()
