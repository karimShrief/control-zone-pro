# Ops Command Platform Testing Guide

This document defines manual validation for the current functional prototype. The prototype uses mock data and local server-backed API routes. It is not production-ready and does not replace formal QA, security testing, integration testing, or UAT.

## Setup

Install dependencies:

```bash
npm install
```

Run the local team server:

```bash
npm run dev:team
```

Open:

```text
http://localhost:8080/
```

Validate code health:

```bash
npm run lint
npm run build
```

There is currently no formal automated test script in `package.json`.

## Mock Credentials

All mock accounts use password `demo`.

| Role      | Username  | Password |
| --------- | --------- | -------- |
| Engineer  | `ahmed`   | `demo`   |
| Manager   | `manager` | `demo`   |
| Executive | `exec`    | `demo`   |
| Admin     | `admin`   | `demo`   |

## API Smoke Checks

With the dev server running:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/tasks
curl http://localhost:8080/api/incidents
curl http://localhost:8080/api/projects
curl http://localhost:8080/api/handover
curl http://localhost:8080/api/shift-requests
curl http://localhost:8080/api/users
```

Login check:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "content-type: application/json" \
  -d "{\"username\":\"ahmed\",\"password\":\"demo\"}"
```

## Role-Based Test Scenarios

### Engineer

1. Log in as `ahmed` / `demo`.
2. Confirm the user lands on `/my-work`.
3. Confirm My Work loads assigned tasks, incidents, shifts, handover context, or available work summaries.
4. Open `/tasks`.
5. Update a task assigned to Ahmed.
6. Try to edit another engineer's assigned task and confirm the action is blocked or not available.
7. Update a shared Daily DC Operations task.
8. Open `/incidents`.
9. Create an incident.
10. Assign or accept an incident where available.
11. Move an incident to In Progress.
12. Resolve an incident.
13. Open `/handover`.
14. Submit one or more handover points.
15. Open `/shift-requests`.
16. Create a shift request.
17. Confirm Engineer cannot approve/reject shift requests.
18. Try direct access to `/admin` and confirm redirect or denial.

Expected result:

- Engineer can work assigned/shared operational items.
- Engineer can submit handover and shift requests.
- Engineer cannot perform manager/admin-only actions.

### Manager

1. Log in as `manager` / `demo`.
2. Confirm the user lands on `/dashboard`.
3. Confirm Command View loads operational KPIs.
4. Open `/tasks`.
5. Assign or reassign a task.
6. Open `/incidents`.
7. Assign an incident to an engineer.
8. Accept, progress, escalate, or resolve an incident where manager action is available.
9. Open `/projects`.
10. Open a project detail page.
11. Add a project task.
12. Update project task progress where permitted.
13. Open `/handover`.
14. Review handover points.
15. Acknowledge a handover point.
16. Approve or mark a handover point as Needs Update.
17. Confirm Manager cannot submit handover.
18. Open `/shift-requests`.
19. Approve a pending request.
20. Reject a pending request.

Expected result:

- Manager can assign work, manage incidents, add project tasks, review handover, and approve/reject shift requests.
- Manager cannot submit handover as an engineer.

### Executive

1. Log in as `exec` / `demo`.
2. Confirm the user lands on `/dashboard`.
3. Confirm dashboard is read-only.
4. Open `/incidents`.
5. Confirm incident data is visible.
6. Confirm no create, assign, accept, progress, resolve, or escalation buttons are available.
7. Open `/projects`.
8. Confirm project data is visible.
9. Confirm no add/update project task controls are available.
10. Open `/sop`, `/productivity`, and `/reports`.
11. Confirm content is visible in read-only mode.
12. Try direct access to `/tasks`, `/handover`, `/shift-requests`, and `/admin`.
13. Confirm unauthorized pages redirect or deny access.

Expected result:

- Executive can view leadership and reporting content.
- Executive cannot mutate operational records.

### Admin

1. Log in as `admin` / `demo`.
2. Confirm the user lands on `/admin`.
3. Open Users tab.
4. Add a user with name, username, role, and team.
5. Change the user's role.
6. Change the user's team.
7. Confirm role/team panels reflect the mock user data.
8. Remove or deactivate user:
   - If the current prototype does not expose remove/deactivate, record this as a backlog gap.
   - Production implementation should support deactivate before delete.
9. Open `/tasks`, `/incidents`, `/projects`, `/shift-requests`, and `/handover`.
10. Confirm Admin has support-level operational access.

Expected result:

- Admin can manage prototype users and access operational modules.
- User removal/deactivation is tracked as a gap if not implemented.

## Workflow Test Scenarios

### Task Flow

1. Login as Manager.
2. Create a task.
3. Assign task to Engineer.
4. Login as Engineer.
5. Update assigned task status.
6. Update shared Daily DC Operations task.
7. Attempt another engineer's assigned task and confirm blocked.
8. Login as Manager and reassign the task.

Pass criteria:

- Assignment updates persist while the server is running.
- RBAC blocks unauthorized engineer edits.
- Task status changes are visible in the table and detail drawer.

### Incident Flow

1. Login as Engineer or Manager.
2. Create incident with title, description, source, and category.
3. Assign incident.
4. Accept incident.
5. Move incident to In Progress.
6. Escalate incident.
7. Resolve incident.
8. Confirm Executive can view but not edit.

Pass criteria:

- Incident lifecycle works end-to-end.
- Role permissions are enforced.
- Dashboard and incident table reflect mock data updates.

### Project/Subtask Flow

1. Login as Manager.
2. Open project list.
3. Open project detail.
4. Add project task.
5. Update task progress.
6. Confirm project progress recalculates.
7. Login as Executive and confirm read-only access.

Pass criteria:

- Project task creation and progress updates work.
- Project completion is calculated from mock task data.
- Read-only roles cannot mutate project records.

### Shift Request Flow

1. Login as Engineer.
2. Create shift swap request.
3. Create leave early request if supported by the current form.
4. Login as Manager.
5. Approve one request.
6. Reject one request.
7. Login as Engineer and confirm status is visible.

Pass criteria:

- Engineer can submit requests.
- Manager/Admin can approve or reject.
- Engineer cannot approve or reject.

### Handover Flow

1. Login as Engineer.
2. Add multiple handover rows.
3. Submit the handover rows.
4. Login as Manager.
5. Confirm submit form is not available.
6. Acknowledge handover row.
7. Approve row.
8. Mark another row Needs Update.
9. Confirm handover metrics update.

Pass criteria:

- Multi-point handover works.
- Manager review actions work.
- Manager cannot submit handover.

### SOP Library Flow

1. Login as any role with SOP access.
2. Search for an SOP.
3. Filter by category.
4. Filter by document type.
5. Trigger mock preview/download.
6. Login as Executive and confirm read-only behavior.

Pass criteria:

- SOP library is searchable and filterable.
- Mock download/preview gives user feedback.
- Executive does not see management actions.

## Regression Checklist

- Login/logout works for all roles.
- Session restores after browser refresh.
- Unauthorized routes redirect or deny access.
- Navigation matches role.
- Engineer cannot edit another engineer's assigned work.
- Daily DC Operations shared tasks are editable by Engineer.
- Manager can assign/reassign tasks.
- Executive has no mutation controls.
- Admin user management works for supported prototype actions.
- Dashboard values come from mock data, not disconnected static numbers.
- Lint passes.
- Build passes.

## Known Prototype Gaps

- Mock data resets when the server restarts.
- Formal automated tests are not present yet.
- Production authentication is not implemented.
- Durable database is not implemented.
- File storage is mocked.
- User remove/deactivate may require implementation if not visible in the current Admin UI.
- External integrations are not connected.
- Security review and deployment design are required before production.
