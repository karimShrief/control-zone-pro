# Ops Command Platform Documentation

## Overview

Ops Command Platform is a TanStack Start + React operations platform for Data Center and NOC teams. The application was generated with Lovable and uses the existing Lovable UI, role-based navigation, and operational pages as the product shell.

The current implementation is backend-ready and uses neutral starter data. Domain mutations are centralized through a lightweight service layer so future backend adapters can replace in-memory arrays without redesigning the UI.

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
    auth.tsx              Auth context, login/logout, role landing helper
    data.ts               Neutral starter data and domain type definitions
    rbac.ts               Route/action role checks
    services.ts           In-memory service layer, ready to swap for API calls
    shift-clock.tsx       Shift clock state and persistence
    utils.ts              Shared utility helpers
  routes/
    __root.tsx            Root route and providers
    index.tsx             Entry redirect route
    login.tsx             Bootstrap credential login page
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
npx tsc --noEmit
bun run lint
bun run build
bun test
```

Current note: `bun test` reports no matching tests until test files are added.

## Authentication model

Authentication currently uses starter username/password records from `src/lib/data.ts`. The app stores the logged-in user id in browser local storage and restores the user from the configured data source on reload.

| Role       | Username    | Password    | Landing page |
| ---------- | ----------- | ----------- | ------------ |
| Engineer   | `engineer`  | `change-me` | `/my-work`   |
| Shift Lead | `shiftlead` | `change-me` | `/my-work`   |
| Manager    | `manager`   | `change-me` | `/dashboard` |
| Executive  | `exec`      | `change-me` | `/dashboard` |
| Admin      | `admin`     | `change-me` | `/admin`     |

Replace these bootstrap users with your real team accounts before production use. See `TEAM_DATA.md`.

## Role-based access control

RBAC is centralized in `src/lib/rbac.ts`.

### Route-level access

| Route prefix      | Allowed roles                                         |
| ----------------- | ----------------------------------------------------- |
| `/dashboard`      | Manager, Executive, Admin                             |
| `/my-work`        | Engineer, Shift Lead                                  |
| `/tasks`          | Engineer, Shift Lead, Manager, Admin                  |
| `/incidents`      | Engineer, Shift Lead, Manager, Executive, Admin       |
| `/projects`       | Engineer, Shift Lead, Manager, Executive, Admin       |
| `/shifts`         | Engineer, Shift Lead, Manager, Executive, Admin       |
| `/shift-requests` | Engineer, Shift Lead, Manager, Admin                  |
| `/handover`       | Engineer, Shift Lead, Manager, Admin                  |
| `/sop`            | Engineer, Shift Lead, Manager, Executive, Admin       |
| `/import-center`  | Shift Lead, Manager, Executive, Admin                 |
| `/productivity`   | Manager, Executive, Admin                             |
| `/reports`        | Shift Lead, Manager, Executive, Admin                 |
| `/admin`          | Admin                                                 |

`AppShell` enforces route access for direct navigation. If no user is logged in, users are redirected to `/login`. If a logged-in user accesses a disallowed route, they are redirected to their role landing page.

### Action-level access

| Action                            | Allowed roles / rules                                    |
| --------------------------------- | -------------------------------------------------------- |
| Task manage/read actions          | Engineer, Shift Lead, Manager, Admin                     |
| Task edit                         | Manager/Admin, or Engineer/Shift Lead if assigned to self or shared |
| Incident create                   | Engineer, Shift Lead, Admin                               |
| Incident work actions             | Engineer, Shift Lead, Manager, Admin                     |
| Shift request submit              | Engineer, Shift Lead                                      |
| Shift request approve/reject      | Manager, Admin                                            |
| Handover submit                   | Engineer, Shift Lead, Manager, Admin                     |
| Handover audit/review             | Shift Lead, Manager, Admin                               |
| SOP create/manage                 | Manager, Admin                                            |
| SOP read/download                 | All roles with SOP route access                           |
| Project manage/add task           | Manager, Admin                                            |
| Project task progress edit        | Manager/Admin, or assigned Engineer/Shift Lead           |
| Roster generation / fixed rules  | Manager, Admin                                            |

## Service layer

Domain logic lives in `src/lib/services.ts`. The service layer is intentionally lightweight and currently mutates starter data arrays in memory.

### Auth helpers

- `authenticateUser(username, password)`
- `getUserById(userId)`

### Task service

- `taskService.list()`
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
- `shiftService.importShifts(...)`
- `shiftService.updateShift(...)`

Current roster generation treats fixed shift assignments as hard constraints before off-day balancing. This is enforced in the roster builder logic and is documented as a required behavior for demo/acceptance validation.

Shift clock sign-in/sign-out state is managed in `src/lib/shift-clock.tsx` and persists to local storage.

### Shift request service

- `shiftRequestService.list()`
- `shiftRequestService.updateStatus(requestId, status, actorId)`

### Handover service

- `handoverService.list()`
- `handoverService.create(actorId, shift)`
- `handoverService.updateAudit(handoverId, audit, actorId)`

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
- SOP download

## Page documentation

### Login

Route: `/login`

Users authenticate with starter username/password credentials. Successful login redirects to the role landing page.

### Engineer My Work

Route: `/my-work`

Shows engineer-focused work including assigned tasks, incidents, project tasks, handover items, and shift context.

### Dashboard

Route: `/dashboard`

Managers see command-level operational KPIs. Executives see executive dashboard content. Admins can also access dashboard-level reporting.

### Tasks

Route: `/tasks`

Supports task filtering, table review, task details, status updates, evidence/comment interactions, escalation, and manager/admin assignment actions. Engineer edit actions are limited to assigned or shared tasks.

### Incidents

Route: `/incidents`

Supports incident filtering by severity/source/category, incident creation, assignment, acceptance, resolution, escalation, comments, evidence, and report attachments. Executives can access incidents in read-only mode.

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

Engineers can submit handover points. Managers/admins can review and mark handover points as approved or needing updates.

### SOP Library

Route: `/sop`

Shows SOP cards with search, category filters, document type filters, and a download action ready for file-service integration. Managers/admins see the New Document action. Executives have read-only access.

### Productivity

Route: `/productivity`

Shows team throughput and SLA charts.

### Reports

Route: `/reports`

Shows report cards and preview/export actions ready for reporting-service integration.

### Admin

Route: `/admin`

Shows users, roles, teams, categories, shift settings, and system configuration views. Admin-only route.

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

- No real backend is connected yet.
- In-memory starter data resets on app reload or server restart.
- Shift clock state uses browser local storage.
- Audit logs are in-memory and reset on reload/restart.
- File attachments and SOP downloads are UI interactions ready for storage integration.
- There are no formal automated test files yet.
- Service methods are frontend-only and should not be treated as security boundaries once a real backend is added.

## Backend integration notes

To connect a real backend while preserving the UI:

1. Keep the service method names stable.
2. Replace in-memory array implementations with backend calls.
3. Move RBAC enforcement into backend authorization policies as well as UI checks.
4. Persist audit log entries on the backend.
5. Add loading/error states around async service calls.
6. Add validation schemas for service inputs.
7. Keep a local starter-data mode available for development.

## Maintenance guidance

- Update `TESTING.md` whenever a role flow changes.
- Update `AGILE_PLAN.md` when priorities or sprint goals change.
- Keep new UI work consistent with the existing Lovable design system.
- Do not add duplicate role pages when existing pages can be wired to services.
- Prefer small service additions over direct component data mutations.
