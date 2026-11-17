"""Deliver administrator email after the site creates a GitHub invitation."""

import argparse
from contextlib import closing
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import format_datetime
import json
import logging
from pathlib import Path
import smtplib
import ssl
import time

from service import database, initialize


def notify_next(db_path, send):
    now = int(time.time())
    with database(db_path) as connection:
        connection.execute("BEGIN IMMEDIATE")
        event = connection.execute("""
            SELECT id, username, created_at, attempts FROM invitation_emails
            WHERE sent_at IS NULL AND next_attempt <= ? ORDER BY id LIMIT 1
        """, (now,)).fetchone()
        if event is None:
            return False
        connection.execute("""
            UPDATE invitation_emails SET attempts = attempts + 1, next_attempt = ?
            WHERE id = ?
        """, (now + 300, event["id"]))

    try:
        send(event)
    except OSError as error:
        logging.warning("Invitation email %s failed (%s)", event["id"], type(error).__name__)
        delay = min(3600, 60 * 2 ** min(event["attempts"], 6))
        with database(db_path) as connection:
            connection.execute("UPDATE invitation_emails SET next_attempt = ? WHERE id = ?",
                               (int(time.time()) + delay, event["id"]))
    else:
        with database(db_path) as connection:
            connection.execute("UPDATE invitation_emails SET sent_at = CURRENT_TIMESTAMP WHERE id = ?",
                               (event["id"],))
        logging.info("Invitation email %s accepted by SMTP", event["id"])
    return True


def make_message(event, sender, recipient):
    created = datetime.fromisoformat(event["created_at"]).replace(tzinfo=timezone.utc)
    beijing = created.astimezone(timezone(timedelta(hours=8)))
    message = EmailMessage()
    message["From"] = sender
    message["To"] = recipient
    message["Subject"] = "win98.site 培训登记｜已创建 GitHub 邀请"
    message["Date"] = format_datetime(datetime.now(timezone.utc))
    message["Message-ID"] = f"<win98-training-{event['id']}@win98.site>"
    message.set_content(
        f"GitHub 账号：{event['username']}\n"
        f"邀请时间：{beijing:%Y-%m-%d %H:%M:%S}（北京时间）\n"
        "GitHub 已创建加入 aust-robot-ai-training 的邀请，等待学员接受。\n"
    )
    return message


def smtp_sender(config):
    host, username, password, recipient = (config[key] for key in ("host", "username", "password", "recipient"))
    port = int(config.get("port", 465))
    sender = config.get("sender", username)
    if (port not in (465, 587)
            or not all(isinstance(value, str) and value.strip() for value in (host, username, password, sender, recipient))
            or not all(address.count("@") == 1 and not any(char.isspace() for char in address)
                       and not any(char in address for char in ",;<>") for address in (sender, recipient))):
        raise ValueError("Invalid SMTP settings")
    tls = ssl.create_default_context()

    def send(event):
        message = make_message(event, sender, recipient)
        if port == 465:
            client = smtplib.SMTP_SSL(host, port, timeout=10, context=tls)
        else:
            client = smtplib.SMTP(host, port, timeout=10)
        with closing(client):
            if port == 587:
                client.starttls(context=tls)
            client.login(username, password)
            client.send_message(message, from_addr=sender, to_addrs=[recipient])

    return send


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=Path("/var/lib/win98-onboarding/registrations.sqlite3"))
    parser.add_argument("--smtp-config", type=Path, required=True)
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    try:
        send = smtp_sender(json.loads(args.smtp_config.read_text(encoding="utf-8")))
    except (OSError, KeyError, TypeError, ValueError):
        parser.error("Unable to load the SMTP notification configuration")
    initialize(args.db)
    while True:
        if not notify_next(args.db, send):
            time.sleep(5)


if __name__ == "__main__":
    main()
