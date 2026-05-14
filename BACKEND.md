# Backend Setup

Control Zone Pro now runs the core team workflows through a server API instead of mutating UI-only state directly.

## Local Team Run

```bash
npm install
npm run dev:team
```

Open:

```text
http://localhost:8080/
```

People on the same network can use the Network URL printed by Vite, for example:

```text
http://192.168.1.54:8080/
```

## Demo Accounts

All demo users use password `demo`.

```text
Engineer:  ahmed
Manager:   manager
Executive: exec
Admin:     admin
```

## Backend API

The API is served from the same app server under `/api`.

```text
GET    /api/health
POST   /api/auth/login
GET    /api/auth/users/:userId
POST   /api/auth/logout

GET    /api/users
POST   /api/users
PATCH  /api/users/:userId

GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:taskId/status
PATCH  /api/tasks/:taskId/assignee

GET    /api/incidents
POST   /api/incidents
PATCH  /api/incidents/:incidentId/assignee
PATCH  /api/incidents/:incidentId/status
POST   /api/incidents/:incidentId/escalate

GET    /api/projects
GET    /api/projects/:projectId
GET    /api/project-tasks
POST   /api/projects/:projectId/tasks
PATCH  /api/project-tasks/:taskId/progress

GET    /api/handover
POST   /api/handover/bulk
PATCH  /api/handover/:handoverId/audit
PATCH  /api/handover/:handoverId/acknowledge

GET    /api/shift-requests
POST   /api/shift-requests
PATCH  /api/shift-requests/:requestId/status
```

## Server-Backed Workflows

These screens now use `src/lib/backend-client.ts` and server routes in `src/server/api.ts`:

- Login and logout
- Admin: list, create, and update mock users
- Tasks: list, create, status update, manager/admin assignment
- Incidents: list, create, assign, accept, progress, resolve, escalation
- Projects: list, detail, project task creation, project task progress
- Shift Handover: list, multi-row submit, manager/admin acknowledgement and audit
- Shift Requests: list, submit, manager/admin approval/rejection

The remaining screens are still read-only/mock-oriented unless listed above.

## Current Persistence Model

This is a server-backed team demo. Changes are shared between users while the dev server is running, because the mutations happen on the server process. Data resets when the server restarts.

For production, replace the in-memory mock store behind `src/lib/services.ts` with a durable database layer such as Cloudflare D1, PostgreSQL, or Supabase. The UI already talks to `src/lib/backend-client.ts`, so that database swap can happen behind the API without redesigning the screens.

## Role Enforcement

The backend validates role permissions for the active workflows:

- Engineers can update tasks assigned to them, shared tasks, and Daily DC Operation tasks.
- Managers/Admins can create, assign, and reassign tasks.
- Engineers/Managers/Admins can create and work incidents.
- Managers/Admins can create project tasks.
- Project task owners and Managers/Admins can update project task progress.
- Engineers can submit handover rows.
- Managers/Admins can acknowledge and audit handover rows.
- Engineers can submit shift requests.
- Managers/Admins can approve or reject shift requests.
- Admins can create and update users.

## Backend Files

```text
src/server.ts                 Routes /api requests before SSR.
src/server/api.ts             Server API router, validation, and RBAC checks.
src/lib/backend-client.ts     Typed browser client used by the UI.
src/lib/services.ts           Current domain service/store implementation.
src/lib/rbac.ts               Shared role/action rules.
```
