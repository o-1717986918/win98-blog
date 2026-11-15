from contextlib import closing, redirect_stdout
from http.client import HTTPConnection
from io import StringIO
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Event, Thread
import unittest

from service import REGISTER_PATH, TEAM_PATH, export_registrations, initialize, make_server


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
        body = {"github_username": username}
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
        self.assertEqual(self.calls, [])

    def test_public_submission_invites_and_retries_do_not_issue_duplicates(self):
        endpoint = TEAM_PATH + "example-user"
        status, data = self.submit("https://github.com/Example-User/")
        self.assertEqual((status, data["github_username"]), (200, "example-user"))
        self.assertNotIn("state", data)
        self.assertEqual(self.calls, [("GET", endpoint), ("PUT", endpoint)])
        self.assertEqual(self.submit("@Example-User"), (200, data))
        self.memberships[endpoint] = "active"
        self.assertEqual(self.submit(), (200, data))
        self.assertEqual(self.submit("Different-User")[0], 200)
        self.assertEqual(self.calls.count(("PUT", endpoint)), 1)
        with redirect_stdout(StringIO()) as report:
            export_registrations(self.db, "", True)
        self.assertIn("example-user,active,", report.getvalue())
        self.assertIn("different-user,pending,", report.getvalue())

    def test_github_failure_can_be_retried(self):
        self.unavailable = True
        status, data = self.submit()
        self.assertEqual(status, 503)
        self.assertNotIn("state", data)
        self.unavailable = False
        self.assertEqual(self.submit()[0], 200)

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
