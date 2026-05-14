# Ops Command Platform Documentation

## Overview

Ops Command Platform is a TanStack Start + React operations platform for Data Center and NOC teams. The application was generated with Lovable and uses the existing Lovable UI, role-based navigation, and operational pages as the product shell.

The current implementation is a server-backed team demo. The main operational mutations now go through `/api` routes on the TanStack Start server, with role checks enforced server-side. The backing store is still the mock domain store, so data is shared while the dev server is running and resets when the server restarts.

For backend details, supported endpoints, and team run instructions, see `BACKEND.md`.

## Technology stack

- React 19
- TanStack Start
- TanStack Router
- TanStack Query provider setup
- Vite
- TypeScript
- Tailwind CSS
- Radix UI primitives
- Recharts
- Sonner toasts
- Bun lockfile with npm-compatible scripts

## Repository structure

```text
src/
  components/
    AppShell.tsx          Authenticated shell, sidebar, top bar, page helpers
    DetailDrawer.tsx      Shared task/incident detail drawer
    ShiftClockCard.tsx    Engineer shift sign-in/sign-out card
    StatusBadge.tsx       Status/severity/priority visual badges
    ui/                   Reusable UI primitives
  lib/
    audit-log.ts          In-memory audit log helpers
    auth.tsx              Auth context, API-backed login/logout, role landing helper
    backend-client.ts     Typed frontend client for /api workflows
    mock-data.ts          Mock users and operational domain data
    rbac.ts               Route/action role checks
    services.ts           Mock service layer for domain operations
    shift-clock.tsx       Shift clock state and persistence
    utils.ts              Shared utility helpers
  routes/
    __root.tsx            Root route and providers
    index.tsx             Entry redirect route
    login.tsx             Mock credential login page
    dashboard.tsx         Manager/executive dashboard views
    my-work.tsx           Engineer work landing page
    tasks.tsx             Task table and task actions
    incidents.tsx         Incident table and incident actions
    projects.tsx          Project cards
    projects.$projectId.tsx Project details and subtasks
    shifts.tsx            Shift schedule and live roster
    shift-requests.tsx    Shift request table/actions
    handover.tsx          Handover submit/review page
    sop.tsx               SOP library
    productivity.tsx      Team productivity analytics
    reports.tsx           Reports catalog
    admin.tsx             Admin configuration UI
  server/
    api.ts                API router, validation, and server-side RBAC
  server.ts               SSR wrapper and /api request entry
```

## Running the app

Install dependencies:

```bash
bun install
```

Fallback:

```bash
npm install
```

Start development server:

```bash
bun run dev -- --host 0.0.0.0
```

Team server command:

```bash
npm run dev:team
```

Open:

```text
http://localhost:8080/
```

Production preview:

```bash
bun run build
bun run preview -- --host 0.0.0.0 --port 4173
```

Open:

```text
http://localhost:4173/
```

## Validation commands

```bash
npm run lint
npm run build
```

Current note: there is no `test` script in `package.json` yet.

## Authentication model

Authentication is mock username/password authentication. The app stores the logged-in user id in browser local storage and restores the user from mock data on reload.

| Role      | Username  | Password | Landing page |
| --------- | --------- | -------- | ------------ |
| Engineer  | `ahmed`   | `demo`   | `/my-work`   |
| Manager   | `manager` | `demo`   | `/dashboard` |
| Executive | `exec`    | `demo`   | `/dashboard` |
| Admin     | `admin`   | `demo`   | `/admin`     |

Additional engineer accounts: `khalid`, `saeed`, `omar`, `hassan`, and `yousef`, all using password `demo`.

## Role-based access control

RBAC is centralized in `src/lib/rbac.ts`.

### Route-level access

| Route prefix      | Allowed roles                       |
| ----------------- | ----------------------------------- |
| `/dashboard`      | Manager, Executive, Admin           |
| `/my-work`        | Engineer                            |
| `/tasks`          | Engineer, Manager, Admin            |
| `/incidents`      | Engineer, Manager, Executive, Admin |
| `/projects`       | Engineer, Manager, Executive, Admin |
| `/shifts`         | Engineer, Manager, Admin            |
| `/shift-requests` | Engineer, Manager, Admin            |
| `/handover`       | Engineer, Manager, Admin            |
| `/sop`            | Engineer, Manager, Executive, Admin |
| `/productivity`   | Manager, Executive, Admin           |
| `/reports`        | Manager, Executive, Admin           |
| `/admin`          | Admin                               |

`AppShell` enforces route access for direct navigation. If no user is logged in, users are redirected to `/login`. If a logged-in user accesses a disallowed route, they are redirected to their role landing page.

### Action-level access

| Action                       | Allowed roles / rules                                                 |
| ---------------------------- | --------------------------------------------------------------------- |
| Task manage/read actions     | Engineer, Manager, Admin                                              |
| Task create                  | Manager, Admin                                                        |
| Task edit                    | Manager/Admin, or Engineer if assigned, shared, or Daily DC Operation |
| Incident create/work actions | Engineer, Manager, Admin                                              |
| Shift request submit         | Engineer                                                              |
| Shift request approve/reject | Manager, Admin                                                        |
| Handover submit              | Engineer                                                              |
| Handover audit/review        | Manager, Admin                                                        |
| Admin user management        | Admin                                                                 |
| SOP create/manage            | Manager, Admin                                                        |
| SOP read/download            | All roles with SOP route access                                       |
| Project manage/add task      | Manager, Admin                                                        |
| Project task progress edit   | Manager/Admin, or assigned Engineer                                   |

## Service layer

Domain logic lives in `src/lib/services.ts`. The service layer is intentionally lightweight and currently mutates mock data arrays in memory.

### Auth helpers

- `authenticateMockUser(username, password)`
- `getMockUserById(userId)`

### User service

- `userService.list()`
- `userService.create(actorId, input)`
- `userService.update(userId, actorId, input)`

### Task service

- `taskService.list()`
- `taskService.get(taskId)`
- `taskService.create(actorId)`
- `taskService.updateStatus(taskId, status, actorId)`
- `taskService.assignTo(taskId, assigneeId, actorId)`

### Incident service

- `incidentService.list()`
- `incidentService.create(actorId, input)`
- `incidentService.assignTo(incidentId, assigneeId, actorId)`
- `incidentService.updateStatus(incidentId, status, actorId)`
- `incidentService.escalate(incidentId, actorId)`

### Project service

- `projectService.list()`
- `projectService.get(projectId)`
- `projectService.listTasks(projectId?)`
- `projectService.createTask(projectId, actorId)`
- `projectService.updateTaskProgress(taskId, completion, actorId)`

Project completion recalculates from the average completion of project subtasks.

### Shift service

- `shiftService.listSchedule()`

Shift clock sign-in/sign-out state is managed in `src/lib/shift-clock.tsx` and persists to local storage.

### Shift request service

- `shiftRequestService.list()`
- `shiftRequestService.create(actorId, input)`
- `shiftRequestService.updateStatus(requestId, status, actorId)`

### Handover service

- `handoverService.list()`
- `handoverService.create(actorId, input)`
- `handoverService.updateAudit(handoverId, audit, actorId)`
- `handoverService.acknowledge(handoverId, actorId)`

### SOP service

- `sopService.list()`
- `sopService.recordDownload(sopId, actorId)`

## Audit logging

Audit logging lives in `src/lib/audit-log.ts` and is currently in memory.

Audit entries include:

- id
- actor id
- action
- entity type
- entity id
- before state, when applicable
- after state, when applicable
- created timestamp
- optional metadata

Examples of audited actions:

- auth login/logout
- task status update and assignment
- incident create/assign/status/escalate
- project task create/progress update
- shift sign-in/sign-out
- shift request approve/reject
- handover create/audit update
- handover acknowledgement
- user create/update
- SOP download

## Page documentation

### Login

Route: `/login`

Users authenticate with mock username/password credentials. Successful login redirects to the role landing page.

### Engineer My Work

Route: `/my-work`

Shows engineer-focused work including assigned tasks, incidents, project tasks, handover items, and shift context.

### Dashboard

Route: `/dashboard`

Managers see command-level operational KPIs. Executives see executive dashboard content. Admins can also access dashboard-level reporting.

### Tasks

Route: `/tasks`

Supports task filtering, table review, task details, status updates, evidence/comment interactions, escalation, and manager/admin assignment actions. Engineer edit actions are limited to assigned or shared tasks.
Manager/admin users can create a mock operations task from the existing Add Task action.

### Incidents

Route: `/incidents`

Supports incident filtering by severity/source/category, mock incident creation, assignment, acceptance, resolution, escalation, comments, evidence, and report attachments. Executives can access incidents in read-only mode.
Incident status can move through assigned, accepted, in progress, resolved, and closed states.

### Projects

Routes:

- `/projects`
- `/projects/$projectId`

Supports project card browsing and project detail tabs. Manager/admin users can add project tasks. Assigned engineers can update their project task progress. Project progress recalculates from subtasks.

### Shifts

Route: `/shifts`

Shows shift schedule, live roster, and the engineer shift clock card. Engineers can sign in/out. Sign-in/out operations persist to local storage and record audit entries.

### Shift Requests

Route: `/shift-requests`

Engineers can submit shift requests. Managers/admins can approve or reject pending requests.

### Handover

Route: `/handover`

Engineers can submit multiple handover points. Managers/admins can acknowledge, approve, or mark handover points as needing updates. Managers cannot submit handover points.

### SOP Library

Route: `/sop`

Shows SOP cards with search, category filters, document type filters, and mock download action. Managers/admins see the New Document action. Executives have read-only access.

### Productivity

Route: `/productivity`

Shows team throughput and SLA charts.

### Reports

Route: `/reports`

Shows report cards and mock preview/export actions.

### Admin

Route: `/admin`

Shows users, roles, teams, categories, shift settings, and system configuration views. Admin users can add mock users and update user role/team values.

## Manual testing checklist

Use `TESTING.md` for detailed step-by-step scenarios. Minimum smoke test:

1. Start app on port `8080`.
2. Login as each role.
3. Verify landing pages.
4. Verify disallowed direct routes redirect.
5. Create/assign/resolve an incident.
6. Add/update a project task.
7. Submit and audit handover.
8. Search/filter/download SOP.
9. Sign in/out from shift as engineer.
10. Run type check, lint, and build.

## Known limitations

- The prototype uses a local server API backed by in-memory mock data.
- Mock array data resets on server restart.
- Shift clock state uses browser local storage.
- Audit logs are in-memory and reset on reload/restart.
- File attachments and SOP downloads are mock UI interactions.
- There are no formal automated test files yet.
- The demo `actorId` request model should not be treated as production authentication.

## Backend integration notes

To connect a real backend while preserving the UI:

1. Keep the service method names stable.
2. Replace mock-array implementations with backend calls.
3. Move RBAC enforcement into backend authorization policies as well as UI checks.
4. Persist audit log entries on the backend.
5. Add loading/error states around async service calls.
6. Add validation schemas for service inputs.
7. Keep mock mode available for demos and local development.

## Maintenance guidance

- Update `TESTING.md` whenever a role flow changes.
- Update `AGILE_PLAN.md` when priorities or sprint goals change.
- Keep new UI work consistent with the existing Lovable design system.
- Do not add duplicate role pages when existing pages can be wired to services.
- Prefer small service additions over direct component data mutations.
