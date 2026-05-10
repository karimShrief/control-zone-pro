# Ops Command Platform Testing Guide

## 1. Setup commands

This repo uses Bun lockfile (`bun.lock`) and can also run through npm because the scripts are defined in `package.json`.

Recommended setup:

```bash
bun install
```

Fallback setup:

```bash
npm install
```

Validation commands:

```bash
npx tsc --noEmit
bun run lint
bun run build
bun test
```

Notes:

- `bun test` currently reports no matching test files if no `*.test.*` or `*.spec.*` files exist.
- If corporate network restrictions block package installs, use the already installed `node_modules` in the cloud workspace when available.

## 2. Run commands

Start the dev server:

```bash
bun run dev -- --host 0.0.0.0
```

Fallback with npm:

```bash
npm run dev -- --host 0.0.0.0
```

Open the app:

```text
http://localhost:8080/
```

In a cloud IDE, use the Ports/Preview panel and open port `8080`.

Production preview:

```bash
bun run build
bun run preview -- --host 0.0.0.0 --port 4173
```

Then open:

```text
http://localhost:4173/
```

## 3. Mock login credentials

All mock accounts use the same password:

```text
password: demo
```

| Role | Username | Password | Expected landing page |
| --- | --- | --- | --- |
| Engineer | `ahmed` | `demo` | `/my-work` |
| Manager | `manager` | `demo` | `/dashboard` |
| Executive | `exec` | `demo` | `/dashboard` |
| Admin | `admin` | `demo` | `/admin` |

Additional engineer accounts are available for assignment checks: `khalid`, `saeed`, `omar`, `hassan`, and `yousef`; each uses password `demo`.

## 4. Role-based test scenarios

### Engineer

1. Log in as `ahmed` / `demo`.
2. Confirm redirect to `/my-work`.
3. Open `/tasks`.
4. Confirm engineer can update shared Daily DC Operations tasks.
5. Confirm engineer cannot edit another engineer's assigned task.
6. Open `/shifts` and verify the shift clock card is visible.
7. Open `/handover` and verify Submit Handover is available.
8. Try direct access to `/admin`; verify redirect away from admin.

### Manager

1. Log in as `manager` / `demo`.
2. Confirm redirect to `/dashboard`.
3. Open `/tasks` and verify manager assignment/reassignment actions are available.
4. Open `/handover` and verify manager sees review/audit actions.
5. Confirm manager does not see Submit Handover as the main action.
6. Open `/shift-requests` and verify approve/reject controls are available for pending requests.

### Executive

1. Log in as `exec` / `demo`.
2. Confirm redirect to `/dashboard`.
3. Open `/incidents`, `/projects`, `/sop`, `/productivity`, and `/reports`.
4. Verify pages load in a read-only mode with operational mutation controls hidden or disabled.
5. Try direct access to `/tasks`, `/handover`, or `/admin`; verify redirect away from unauthorized pages.

### Admin

1. Log in as `admin` / `demo`.
2. Confirm redirect to `/admin`.
3. Verify user management content is visible.
4. Open `/tasks`, `/incidents`, `/projects`, `/shifts`, `/shift-requests`, `/handover`, `/sop`, `/productivity`, and `/reports` to verify admin access.

## 5. Incident test scenario

1. Log in as `manager` / `demo`.
2. Open `/incidents`.
3. Click Create Incident.
4. Verify a new incident appears with:
   - Source: `Manual`
   - Category: `Unknown`
   - Status: `Unassigned`
   - Assignee: `Unassigned`
5. Use Assign to me or assignment action where available.
6. Log out and log in as `ahmed` / `demo`.
7. Open `/incidents`.
8. Accept an assigned incident.
9. Resolve the incident.
10. Verify status updates in the incidents table.

## 6. Project task test scenario

1. Log in as `manager` / `demo` or `admin` / `demo`.
2. Open `/projects`.
3. Open project `P-301`.
4. Go to the Tasks tab.
5. Click Add Project Task.
6. Verify a new project task appears in the task list.
7. Click Update on a project task.
8. Verify progress increases and the task status changes when applicable.
9. Log in as an engineer.
10. Verify the engineer can update only assigned project tasks, not tasks assigned to other engineers.
11. Verify project progress reflects subtask progress updates.

## 7. Handover test scenario

1. Log in as `ahmed` / `demo`.
2. Open `/handover`.
3. Click Submit Handover Point.
4. Verify a new handover point appears with today's date and the selected/current shift context.
5. Log out and log in as `manager` / `demo`.
6. Open `/handover`.
7. Verify Submit Handover is not the main action.
8. Use Approve or Needs Update on a handover point.
9. Verify the audit status updates.

## 8. SOP library test scenario

1. Log in as any role.
2. Open `/sop`.
3. Verify SOP cards load.
4. Use the search box to search for a known term, such as `network`, `cooling`, or `audit`.
5. Use category and document type filters.
6. Click Download on an SOP.
7. Verify a success toast/feedback appears for the mock download action.
8. Log in as `manager` or `admin` and verify New Document is visible.
9. Log in as `exec` and verify SOP access is read-only.

## 9. Known limitations

- Data is mock/in-memory unless specifically persisted to local storage.
- Audit logs are in-memory only and reset when the app reloads or restarts.
- File uploads and SOP downloads are mock actions; no real file storage is connected.
- There are no formal automated test files yet.
- Some lint warnings may appear for existing Fast Refresh export patterns in UI/helper files.
