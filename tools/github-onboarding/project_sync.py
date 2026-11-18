"""Keep the private GitHub training roster in sync with disclosed registrations."""

import argparse
from contextlib import closing
import http.client
import json
import logging
import os
from pathlib import Path
import sqlite3
import time

from service import TEAM_PATH, github_client


ORG = "aust-robot-ai-training"
FIELDS = {"major": "专业", "class_name": "班级", "student_name": "姓名", "state": "邀请状态"}
ROW_MARKER = "由 win98.site 培训登记同步"
MEMBERSHIP = {"pending": "待接受邀请", "active": "已加入团队"}


class SyncError(Exception):
    pass


def graphql_client(token):
    headers = {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "User-Agent": "win98-training-roster",
    }

    def graphql(document, variables):
        body = json.dumps({"query": document, "variables": variables})
        with closing(http.client.HTTPSConnection("api.github.com", timeout=12)) as client:
            client.request("POST", "/graphql", body, headers)
            response = client.getresponse()
            if response.status != 200:
                raise SyncError(f"GitHub GraphQL HTTP {response.status}")
            reply = json.loads(response.read(2_097_152))
        if reply.get("errors") or not reply.get("data"):
            raise SyncError("GitHub GraphQL rejected the roster request")
        return reply["data"]

    return graphql


def local_registrations(path):
    with closing(sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)) as connection:
        connection.row_factory = sqlite3.Row
        return connection.execute("""
            SELECT d.username, p.major, p.class_name, p.student_name
            FROM project_directory d
            JOIN student_profiles p USING (username)
            JOIN registrations r USING (username)
            WHERE r.state IN ('pending', 'active')
            ORDER BY d.submitted_at, d.username
        """).fetchall()


def read_project(graphql, number):
    data = graphql("""
        query($owner:String!, $number:Int!) {
          organization(login:$owner) {
            projectV2(number:$number) {
              id public closed
              fields(first:50) { nodes { ... on ProjectV2FieldCommon { id name dataType } } }
            }
          }
        }
    """, {"owner": ORG, "number": number})
    project = (data.get("organization") or {}).get("projectV2")
    if not project or project["public"] or project["closed"]:
        raise SyncError("Roster destination must be an open, private organization project")
    fields = {field["name"]: field["id"] for field in project["fields"]["nodes"]
              if field.get("dataType") == "TEXT"}
    if not all(label in fields for label in FIELDS.values()):
        raise SyncError("Roster project is missing required text columns")
    return project["id"], {key: fields[label] for key, label in FIELDS.items()}


def synced_items(graphql, project_id):
    result = {}
    cursor = None
    while True:
        data = graphql("""
            query($project:ID!, $cursor:String) {
              node(id:$project) {
                ... on ProjectV2 {
                  items(first:50, after:$cursor) {
                    pageInfo { endCursor hasNextPage }
                    nodes {
                      id isArchived
                      content { ... on DraftIssue { title body } }
                      fieldValues(first:30) {
                        nodes {
                          ... on ProjectV2ItemFieldTextValue {
                            text field { ... on ProjectV2FieldCommon { id } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
        """, {"project": project_id, "cursor": cursor})["node"]["items"]
        for item in data["nodes"]:
            content = item.get("content") or {}
            if content.get("body") == ROW_MARKER and not item["isArchived"]:
                result[content["title"]] = item
        if not data["pageInfo"]["hasNextPage"]:
            return result
        cursor = data["pageInfo"]["endCursor"]


def sync_registration(graphql, github, project_id, fields, row, existing):
    status, data = github("GET", TEAM_PATH + row["username"])
    if status == 200 and data.get("state") in MEMBERSHIP:
        membership = MEMBERSHIP[data["state"]]
    elif status == 404 and existing:
        membership = "未加入团队"
    else:
        return

    if existing:
        known_values = {node["field"]["id"]: node["text"] for node in existing["fieldValues"]["nodes"]
                        if node and node.get("field")}
    else:
        existing = graphql("""
            mutation($project:ID!, $title:String!, $body:String!) {
              addProjectV2DraftIssue(input:{projectId:$project,title:$title,body:$body}) {
                projectItem { id }
              }
            }
        """, {"project": project_id, "title": row["username"], "body": ROW_MARKER})["addProjectV2DraftIssue"]["projectItem"]
        known_values = {}

    values = {"major": row["major"], "class_name": row["class_name"],
              "student_name": row["student_name"], "state": membership}
    updates = [{"projectId": project_id, "itemId": existing["id"], "fieldId": field, "value": {"text": values[key]}}
               for key, field in fields.items() if known_values.get(field) != values[key]]
    if updates:
        indexes = range(len(updates))
        inputs = ", ".join(f"$field{i}:UpdateProjectV2ItemFieldValueInput!" for i in indexes)
        operations = " ".join(f"field{i}:updateProjectV2ItemFieldValue(input:$field{i}) {{ projectV2Item {{ id }} }}"
                              for i in indexes)
        graphql(f"mutation({inputs}) {{ {operations} }}", {f"field{i}": entry for i, entry in enumerate(updates)})


def synchronize(path, graphql, github, number):
    project_id, fields = read_project(graphql, number)
    registrations = local_registrations(path)
    if registrations:
        existing = synced_items(graphql, project_id)
        for student in registrations:
            sync_registration(graphql, github, project_id, fields, student, existing.get(student["username"]))
    return len(registrations)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=Path("/var/lib/win98-onboarding/registrations.sqlite3"))
    parser.add_argument("--project", type=int, required=True)
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    token = (Path(os.environ["CREDENTIALS_DIRECTORY"]) / "github-token").read_text().strip()
    graphql, github = graphql_client(token), github_client(token)
    while True:
        try:
            total = synchronize(args.db, graphql, github, args.project)
        except (OSError, http.client.HTTPException, ValueError, sqlite3.Error, SyncError) as error:
            logging.warning("Roster sync failed (%s)", type(error).__name__)
            if args.once:
                return 1
        else:
            if args.once:
                logging.info("Roster sync checked %s registrations", total)
                return 0
        time.sleep(120)


if __name__ == "__main__":
    raise SystemExit(main())
