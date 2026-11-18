from contextlib import closing, redirect_stdout
import csv
from http.client import HTTPConnection
from io import StringIO
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Event, Thread
import unittest

from notify import make_message, notify_next
from project_sync import FIELDS, synchronize
from service import DIRECTORY_NOTICE, REGISTER_PATH, TEAM_PATH, database, export_registrations, initialize, make_server, set_student


class RegistrationTest(unittest.TestCase):
    def setUp(self):
        temp = TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.db = Path(temp.name) / "test.db"
        initialize(self.db)
        self.calls = []
        self.memberships = {}
        self.unavailable = False
        self.paused = None
        server = make_server(0, "https://win98.site", self.db, self.github)
        self.port = server.server_port
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(thread.join, 5)
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)

    def github(self, method, path):
        self.calls.append((method, path))
        if self.unavailable:
            return 403, {}
        if self.paused:
            entered, proceed = self.paused
            entered.set()
            if not proceed.wait(4):
                raise TimeoutError
        if method == "PUT":
            self.memberships[path] = "pending"
        if path not in self.memberships:
            return 404, {}
        return 200, {"state": self.memberships[path]}

    def submit(self, username="Example-User", **kwargs):
        body = {"github_username": username, "student_info": "计算机26-4王小明"}
        body.update(kwargs.pop("payload", {}))
        headers = {
            "Origin": kwargs.pop("origin", "https://win98.site"),
            "Content-Type": "application/json",
        }
        with closing(HTTPConnection("127.0.0.1", self.port, timeout=5)) as client:
            client.request("POST", REGISTER_PATH, body=json.dumps(body), headers=headers)
            response = client.getresponse()
            self.assertEqual(response.getheader("Cache-Control"), "no-store")
            return response.status, json.loads(response.read())

    def test_rejected_requests_never_contact_github(self):
        self.assertEqual(self.submit(origin="https://foreign.invalid")[0], 403)
        self.assertEqual(self.submit(username="not/a/user")[0], 400)
        self.assertEqual(self.submit(payload={"website": "https://bot.invalid"})[0], 400)
        for invalid in (None, "王小明", "计算机-26-4-=1+1", "计算机26-4王\n小明"):
            self.assertEqual(self.submit(payload={"student_info": invalid})[0], 400)
        self.assertEqual(self.calls, [])

    def test_public_submission_invites_and_retries_do_not_issue_duplicates(self):
        endpoint = TEAM_PATH + "example-user"
        status, data = self.submit("https://github.com/Example-User/")
        self.assertEqual((status, data["github_username"]), (200, "example-user"))
        self.assertEqual(set(data), {"github_username", "message"})
        self.assertEqual(self.calls, [("GET", endpoint), ("PUT", endpoint)])
        self.assertEqual(self.submit("@Example-User", payload={"student_info": "计算机－２６－４－王小明"}), (200, data))
        self.memberships[endpoint] = "active"
        self.assertEqual(self.submit(), (200, data))
        self.assertEqual(self.submit("Different-User", payload={"student_info": "软件工程-卓越班-李晓华"})[0], 200)
        self.assertEqual(self.calls.count(("PUT", endpoint)), 1)
        with redirect_stdout(StringIO()) as report:
            export_registrations(self.db, "", True)
        rows = {row["github_username"]: row for row in csv.DictReader(StringIO(report.getvalue()))}
        self.assertEqual(rows["example-user"]["last_invite_state"], "active")
        self.assertEqual(rows["example-user"]["major"], "计算机")
        self.assertEqual(rows["example-user"]["class_name"], "26-4")
        self.assertEqual(rows["example-user"]["student_name"], "王小明")
        self.assertEqual(rows["different-user"]["student_name"], "李晓华")

    def test_public_request_cannot_replace_an_existing_mapping(self):
        self.assertEqual(self.submit()[0], 200)
        original_calls = list(self.calls)
        status, data = self.submit(payload={"student_info": "计算机26-4赵小明"})
        self.assertEqual(status, 409)
        self.assertNotIn("王小明", data["error"])
        self.assertEqual(self.calls, original_calls)
        set_student(self.db, "example-user", ("计算机", "26-4", "赵小明"))
        self.assertEqual(self.submit(payload={"student_info": "计算机26-4赵小明"})[0], 200)

    def test_existing_username_can_add_student_profile(self):
        endpoint = TEAM_PATH + "example-user"
        with database(self.db) as connection:
            connection.execute("""
                INSERT INTO registrations (username, state, registered_at)
                VALUES ('example-user', 'active', '2026-11-15 09:00:00')
            """)
        initialize(self.db)
        self.memberships[endpoint] = "active"
        self.assertEqual(self.submit()[0], 200)
        self.assertEqual(self.calls, [("GET", endpoint)])
        with database(self.db) as connection:
            row = connection.execute("""
                SELECT r.registered_at, p.student_name FROM registrations r
                JOIN student_profiles p ON r.username = p.username
            """).fetchone()
        self.assertEqual(tuple(row), ("2026-11-15 09:00:00", "王小明"))

    def test_github_failure_can_be_retried(self):
        self.unavailable = True
        status, data = self.submit()
        self.assertEqual(status, 503)
        self.assertNotIn("state", data)
        self.unavailable = False
        self.assertEqual(self.submit()[0], 200)

    def test_email_queues_once_for_a_new_invitation_and_can_retry(self):
        self.memberships[TEAM_PATH + "already-pending"] = "pending"
        self.memberships[TEAM_PATH + "already-active"] = "active"
        self.assertEqual(self.submit("Already-Pending")[0], 200)
        self.assertEqual(self.submit("Already-Active")[0], 200)
        self.assertEqual(self.submit()[0], 200)
        self.assertEqual(self.submit()[0], 200)

        emails = []

        def send(event):
            emails.append(make_message(event, "sender@example.test", "admin@example.test"))
            if len(emails) == 1:
                raise TimeoutError

        self.assertTrue(notify_next(self.db, send))
        self.assertFalse(notify_next(self.db, send))
        with database(self.db) as connection:
            rows = connection.execute("SELECT username, attempts, sent_at FROM invitation_emails").fetchall()
            self.assertEqual([tuple(row) for row in rows], [("example-user", 1, None)])
            connection.execute("UPDATE invitation_emails SET next_attempt = 0")
        self.assertTrue(notify_next(self.db, send))
        self.assertFalse(notify_next(self.db, send))
        self.assertEqual(emails[0]["Message-ID"], emails[1]["Message-ID"])
        self.assertIn("example-user", emails[1].get_content())
        self.assertNotIn("王小明", emails[1].get_content())

    def test_roster_sync_only_includes_submissions_with_the_disclosure(self):
        self.assertEqual(self.submit("Legacy-User")[0], 200)
        payload = {"directory_notice": DIRECTORY_NOTICE}
        self.assertEqual(self.submit(payload=payload)[0], 200)
        fields = [{"name": label, "id": key, "dataType": "TEXT"} for key, label in FIELDS.items()]
        item = None
        writes = []

        def graphql(document, variables):
            nonlocal item
            if "organization(login:" in document:
                return {"organization": {"projectV2": {"id": "project", "public": False, "closed": False,
                                                        "fields": {"nodes": fields}}}}
            if "items(first:" in document:
                return {"node": {"items": {"pageInfo": {"hasNextPage": False}, "nodes": [item] if item else []}}}
            if "addProjectV2DraftIssue" in document:
                self.assertIsNone(item)
                item = {"id": "draft", "isArchived": False, "fieldValues": {"nodes": []},
                        "content": {"body": variables["body"], "title": variables["title"]}}
                return {"addProjectV2DraftIssue": {"projectItem": {"id": "draft"}}}
            updates = {entry["fieldId"]: entry["value"]["text"] for entry in variables.values()}
            writes.append(updates)
            known = {node["field"]["id"]: node["text"] for node in item["fieldValues"]["nodes"]}
            known.update(updates)
            item["fieldValues"]["nodes"] = [{"field": {"id": key}, "text": value} for key, value in known.items()]

        self.assertEqual(synchronize(self.db, graphql, self.github, 1), 1)
        self.assertEqual(item["content"]["title"], "example-user")
        self.assertEqual(writes, [{"major": "计算机", "class_name": "26-4",
                                   "student_name": "王小明", "state": "待接受邀请"}])
        self.memberships[TEAM_PATH + "example-user"] = "active"
        self.assertEqual(synchronize(self.db, graphql, self.github, 1), 1)
        self.assertEqual(writes[-1], {"state": "已加入团队"})
        synchronize(self.db, graphql, self.github, 1)
        self.assertEqual(len(writes), 2)

    def test_simultaneous_submissions_create_one_invitation(self):
        entered, proceed = self.paused = Event(), Event()
        results = []
        thread = Thread(target=lambda: results.append(self.submit()), daemon=True)
        thread.start()
        try:
            self.assertTrue(entered.wait(4))
            self.assertEqual(self.submit()[0], 409)
        finally:
            proceed.set()
            thread.join(5)
        self.assertEqual(results[0][0], 200)
        self.assertEqual([method for method, _ in self.calls], ["GET", "PUT"])


if __name__ == "__main__":
    unittest.main()
