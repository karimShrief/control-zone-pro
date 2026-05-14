# Code Walkthrough

This document explains how Control Zone Pro is structured, how the frontend and backend fit together, and where a developer should make common changes.

## Big Picture

Control Zone Pro is a TanStack Start React application. The same app serves:

- The React UI.
- Server-rendered routes.
- A local `/api` backend used by the team workflows.

The UI is intentionally kept close to the original Lovable-generated structure. Backend behavior is added behind a typed client and server API so the UI can keep its shape while data handling becomes more production-ready.

## Request Flow

```text
Browser
  |
  | React route, page, or button action
  v
src/lib/backend-client.ts
  |
  | fetch("/api/...")
  v
src/server.ts
  |
  | if path starts with /api
  v
src/server/api.ts
  |
  | validates body + role permissions
  v
src/lib/services.ts
  |
  | mutates current server-side mock store
  v
JSON response back to UI
```

If the request is not an API request, `src/server.ts` passes it to the TanStack Start SSR handler.

## Entry Points

### `src/server.ts`

This is the server entry configured in `vite.config.ts`.

Responsibilities:

- Imports the API handler from `src/server/api.ts`.
- Intercepts `/api/*` requests before SSR.
- For normal app pages, delegates to `@tanstack/react-start/server-entry`.
- Wraps catastrophic SSR failures with the custom branded error page.

This is the first place to check if API routes are not being reached.

### `src/start.ts`

Configures TanStack Start request middleware.

Current purpose:

- Catches unexpected server-rendering errors.
- Returns the branded error page for non-HTTP errors.

### `src/router.tsx`

Creates the TanStack Router instance.

Current setup:

- Uses the generated route tree from `src/routeTree.gen.ts`.
- Creates a React Query `QueryClient`.
- Enables scroll restoration.

### `src/routes/__root.tsx`

Defines the root route, HTML shell, providers, and top-level error/not-found screens.

Provider order:

```text
QueryClientProvider
  AuthProvider
    ShiftClockProvider
      AppShell
        Outlet
      Toaster
```

This means all route pages can access auth, shift-clock state, and app shell layout.

## Backend API

### `src/server/api.ts`

This file is the server API router. It uses a small route table instead of adding a separate backend framework.

Responsibilities:

- Matches HTTP method and pathname.
- Parses JSON bodies.
- Returns JSON responses.
- Looks up the acting user from `actorId`.
- Applies server-side RBAC checks.
- Calls domain services in `src/lib/services.ts`.

Main endpoint groups:

```text
/api/health
/api/auth/*
/api/users/*
/api/tasks/*
/api/incidents/*
/api/projects/*
/api/project-tasks/*
/api/handover/*
/api/shift-requests/*
```

Why `actorId` exists:

- This is still a demo auth model.
- The UI stores the logged-in user id.
- Mutating API calls send `actorId`.
- The backend checks the user role before allowing the action.

Production replacement:

- Replace `actorId` with signed sessions, JWTs, or your identity provider.
- Keep the same route-level role checks.

## Frontend API Client

### `src/lib/backend-client.ts`

This is the only frontend file that should know the exact API URLs.

Responsibilities:

- Wraps `fetch`.
- Parses JSON.
- Converts non-2xx responses into thrown errors.
- Exposes typed methods like:

```text
login
listUsers
createUser
updateUser
listTasks
createTask
updateTaskStatus
listIncidents
createIncident
getProject
createProjectTask
listHandover
createHandoverRows
acknowledgeHandover
listShiftRequests
updateShiftRequestStatus
```

When adding a new backend endpoint, add the frontend wrapper here before wiring a page to it.

## Domain Store And Services

### `src/lib/mock-data.ts`

Contains the current seed data and domain TypeScript types.

Examples:

- `User`
- `Task`
- `Incident`
- `Project`
- `ProjectTask`
- `ShiftRequest`
- `HandoverPoint`

This is the current source of demo data.

### `src/lib/services.ts`

Contains domain operations over the mock arrays.

Examples:

- Authenticate a demo user.
- Create and update admin-managed users.
- List and update tasks.
- Create and update incidents.
- Create project tasks and recalculate project completion.
- Create shift requests and handover rows.

Important: this file is currently the persistence boundary. Because API calls run on the server process, mutations are shared while the dev server is running. Data resets on server restart.

Production replacement:

- Keep function signatures similar.
- Replace mock array reads/writes with database queries.
- Preserve audit log calls and RBAC checks.

### `src/lib/audit-log.ts`

Stores audit log entries in memory.

Used by services and UI-only workflows to record actions like:

- Login/logout.
- Status updates.
- Assignment changes.
- Handover submission.
- Shift request approval.

Production replacement:

- Store audit records in a durable append-only table.
- Include request metadata such as IP, user agent, and request id.

## Auth And Permissions

### `src/lib/auth.tsx`

Provides the auth React context.

Responsibilities:

- Restores a user id from `localStorage`.
- Fetches the user from `/api/auth/users/:userId`.
- Logs in through `/api/auth/login`.
- Logs out through `/api/auth/logout`.
- Exposes `landingFor(role)`.

Current limitation:

- The browser stores only a demo user id.
- This is acceptable for team demos, not production.

### `src/lib/rbac.ts`

Defines route and action permissions.

Examples:

- Engineers can access `/my-work`.
- Managers/Admins can approve shift requests.
- Engineers can submit handover rows.
- Managers/Admins can acknowledge and audit handover rows.
- Admins can create and update users.
- Engineers can edit Daily DC Operations tasks, but cannot edit other engineers' assigned work.
- Project task owners and Managers/Admins can update project task progress.

The same functions are used by both the UI and the backend API, which keeps visible controls and server enforcement aligned.

## Layout And Shared UI

### `src/components/AppShell.tsx`

Authenticated app frame.

Responsibilities:

- Sidebar navigation.
- Top bar/user context.
- Route access wrapping.
- Shared `PageHeader` and `KpiCard` helpers.

If a route should appear in navigation, update this file.

### `src/components/StatusBadge.tsx`

Central badge styling for statuses, severities, priorities, and category labels.

Use this instead of custom status colors in route pages.

### `src/components/DetailDrawer.tsx`

Shared drawer for task and incident details.

Current capabilities:

- Status update.
- Comments.
- Evidence list.
- Incident reports.
- Activity timeline.
- Self-assignment.

Backend-backed today:

- Task status.
- Incident status.
- Task/incident assignment.

Still local-only in the drawer:

- Comments.
- Evidence metadata.
- Report metadata.
- Activity tab records.

Those should become API-backed when file storage and comments are implemented.

### `src/components/ShiftClockCard.tsx`

Engineer shift clock-in/clock-out card.

Current behavior:

- Uses `src/lib/shift-clock.tsx`.
- Stores clock state in browser `localStorage`.

Production replacement:

- Move shift attendance to an API table.
- Record clock-in/out audit events server-side.

## Routes

### `src/routes/login.tsx`

Login screen.

Uses:

- `useAuth()`.
- Demo username/password form.
- Routes users to the right landing page after login.

### `src/routes/index.tsx`

Entry redirect route.

Usually sends users to login or their role landing page.

### `src/routes/my-work.tsx`

Engineer landing page.

Shows:

- My tasks.
- My incidents.
- My shifts.
- My handover points.
- Shift clock card.

Current note:

- This page still reads mostly from mock data directly. It is more of a dashboard/landing summary than a mutation surface.

### `src/routes/dashboard.tsx`

Manager/executive dashboard.

Shows KPI summaries and charts from mock operational data.

### `src/routes/tasks.tsx`

Task operations page.

Backend-backed:

- List tasks from `/api/tasks`.
- Create tasks through `POST /api/tasks` for managers/admins.
- Escalate/update task status through `/api/tasks/:taskId/status`.
- Manager/Admin assignment through `/api/tasks/:taskId/assignee`.

Uses `DetailDrawer` for detailed updates.

### `src/routes/incidents.tsx`

Incident operations page.

Backend-backed:

- List incidents.
- Create incident.
- Assign incident.
- Accept/progress/resolve status changes.
- Escalate incident.

### `src/routes/projects.tsx`

Project list page.

Backend-backed:

- Loads projects through `/api/projects`.
- Loads project tasks through `/api/project-tasks`.
- Displays task count and project progress.

### `src/routes/projects.$projectId.tsx`

Project detail page.

Backend-backed:

- Loads project and tasks through `/api/projects/:projectId`.
- Adds project tasks through `/api/projects/:projectId/tasks`.
- Updates project task progress through `/api/project-tasks/:taskId/progress`.

Project completion is recalculated in `src/lib/services.ts`.

### `src/routes/shifts.tsx`

Shift schedule page.

Current behavior:

- Reads schedule from `shiftService`.
- Mostly display-only.

### `src/routes/shift-requests.tsx`

Shift request workflow.

Backend-backed:

- Loads requests through `/api/shift-requests`.
- Engineers submit requests through `POST /api/shift-requests`.
- Managers/Admins approve or reject through `PATCH /api/shift-requests/:requestId/status`.

### `src/routes/handover.tsx`

Shift handover workflow.

Backend-backed:

- Loads handover rows through `/api/handover`.
- Engineers add multiple draft rows and submit them through `/api/handover/bulk`.
- Managers/Admins acknowledge rows through `/api/handover/:handoverId/acknowledge`.
- Managers/Admins audit rows through `/api/handover/:handoverId/audit`.

### `src/routes/sop.tsx`

SOP library.

Current behavior:

- Lists SOPs from mock data.
- Records mock download through `sopService`.

### `src/routes/productivity.tsx`

Productivity analytics page.

Current behavior:

- Displays mock analytics.

### `src/routes/reports.tsx`

Reports catalog page.

Current behavior:

- Displays report cards/placeholders.

### `src/routes/admin.tsx`

Admin configuration page.

Current behavior:

- Displays role/system configuration concepts.
- Lists users through `/api/users`.
- Admins can create users through `POST /api/users`.
- Admins can update user role/team through `PATCH /api/users/:userId`.

## Styling

### `src/styles.css`

Global styling and Tailwind CSS design tokens.

The app uses CSS variables for theme colors. Route pages use Tailwind utility classes and shared UI primitives.

### `src/components/ui/*`

Reusable UI primitives, mostly Radix/shadcn-style components.

Guideline:

- Prefer these existing components before adding new UI primitives.
- Keep app-specific business logic out of `components/ui`.

## Generated Files

### `src/routeTree.gen.ts`

Generated by TanStack Router.

Do not manually edit unless absolutely necessary. It updates when route files change during dev/build.

## Adding A New Backend Workflow

Use this sequence:

1. Add or update a service function in `src/lib/services.ts`.
2. Add an API route in `src/server/api.ts`.
3. Apply backend RBAC checks from `src/lib/rbac.ts`.
4. Add a typed client function in `src/lib/backend-client.ts`.
5. Update the route/component to call the client.
6. Show success/error toasts.
7. Run `npm run build`.
8. Add a smoke check to `TESTING.md` if the workflow matters to the team.

## Production Hardening Checklist

Before real production use:

- Replace demo `actorId` auth with sessions/JWT/SSO.
- Replace mock arrays in `src/lib/mock-data.ts` and `src/lib/services.ts` with a database.
- Move audit logs into durable storage.
- Move shift clock state from `localStorage` to backend tables.
- Add API tests for RBAC and validation.
- Add UI tests for core workflows.
- Add real file storage for evidence and reports.
- Add environment-specific configuration for dev/stage/prod.
- Review secrets, CORS, rate limits, and deployment settings.
