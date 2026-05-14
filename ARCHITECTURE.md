# Ops Command Platform Architecture

## Architecture Status

The current Ops Command Platform is a functional prototype. It uses a React/TanStack frontend, local server API routes, and an in-memory mock service layer.

This architecture is appropriate for workflow validation and internal demonstration. It is not a production architecture until authentication, persistence, integrations, deployment, and security controls are formally designed and approved.

## High-Level Architecture

```text
Browser
  |
  | React UI, TanStack Router, role-aware pages
  v
Frontend API Client
  |
  | fetch("/api/...")
  v
TanStack Start Server
  |
  | /api request routing
  v
Server API Router
  |
  | validation, actor lookup, RBAC checks
  v
Mock Service Layer
  |
  | in-memory mock data mutation
  v
Mock Data + Audit Log
```

## Frontend Structure

Primary frontend areas:

```text
src/
  components/
    AppShell.tsx
    DetailDrawer.tsx
    ShiftClockCard.tsx
    StatusBadge.tsx
    ui/
  lib/
    auth.tsx
    backend-client.ts
    mock-data.ts
    rbac.ts
    services.ts
    audit-log.ts
    shift-clock.tsx
  routes/
    login.tsx
    my-work.tsx
    dashboard.tsx
    tasks.tsx
    incidents.tsx
    projects.tsx
    projects.$projectId.tsx
    shifts.tsx
    shift-requests.tsx
    handover.tsx
    sop.tsx
    productivity.tsx
    reports.tsx
    admin.tsx
  server/
    api.ts
  server.ts
```

### Key Frontend Responsibilities

- Render role-specific pages and navigation.
- Restore current mock user session from browser storage.
- Hide or show actions based on role permissions.
- Call `src/lib/backend-client.ts` for server-backed prototype actions.
- Show success/error feedback for workflow actions.
- Preserve the Lovable UI design and interaction style.

## Mock Backend / Service Layer

### API Entry

`src/server.ts` checks whether a request is for `/api/*`. API requests are routed to `src/server/api.ts`. Non-API requests continue through the TanStack Start server rendering flow.

### API Router

`src/server/api.ts` is a lightweight API router. It is responsible for:

- Matching method and path.
- Parsing JSON request bodies.
- Loading the acting mock user from `actorId`.
- Applying role-based permission checks.
- Calling domain services.
- Returning JSON responses.

### Frontend Client

`src/lib/backend-client.ts` wraps `fetch` calls and provides typed methods for:

- Auth login/logout/current user lookup.
- Users.
- Tasks.
- Incidents.
- Projects and project tasks.
- Shift requests.
- Handover.

### Service Layer

`src/lib/services.ts` contains the current domain operations over mock data arrays:

- `userService`
- `taskService`
- `incidentService`
- `projectService`
- `shiftService`
- `shiftRequestService`
- `handoverService`
- `sopService`

The service layer is the main replacement point for a future database-backed implementation.

## Data Models

Data models are currently defined in `src/lib/mock-data.ts`.

### User

Core fields:

- `id`
- `username`
- `password`
- `name`
- `role`
- `team`

Roles:

- `engineer`
- `manager`
- `executive`
- `admin`

### Task

Core fields:

- `id`
- `title`
- `description`
- `type`
- `category`
- `priority`
- `impact`
- `status`
- `assignee`
- `dueDate`
- `sla`
- `comments`
- `evidence`
- `audit`

Daily DC Operations tasks may be shared and editable by engineers according to RBAC rules.

### Incident

Core fields:

- `id`
- `title`
- `description`
- `source`
- `sourceRef`
- `category`
- `subcategory`
- `severity`
- `status`
- `assignee`
- `sla`
- `createdAt`
- `updatedAt`
- `resolution`

### Project

Core fields:

- `id`
- `name`
- `description`
- `type`
- `team`
- `owner`
- `status`
- `risk`
- `completion`
- `targetDate`

### ProjectTask

Core fields:

- `id`
- `projectId`
- `title`
- `description`
- `assignee`
- `status`
- `priority`
- `dueDate`
- `completion`
- `comments`
- `evidence`

Project completion is calculated from related project task completion.

### ShiftRequest

Core fields:

- `id`
- `type`
- `requester`
- `requestedDate`
- `currentShift`
- `requestedShift`
- `reason`
- `status`
- `managerApproval`

### HandoverPoint

Core fields:

- `id`
- `date`
- `shift`
- `title`
- `category`
- `priority`
- `status`
- `owner`
- `relatedRef`
- `nextAction`
- `notes`
- `evidence`
- `acknowledged`
- `audit`

### SOP

Core fields typically include:

- `id`
- `title`
- `category`
- `documentType`
- `status`
- `owner`
- `version`
- `updatedAt`

The SOP library is currently mock-backed and should be expanded for production document governance.

## Role-Based Access Control Approach

RBAC is centralized in `src/lib/rbac.ts`.

The prototype uses two layers:

1. UI layer: hides or shows routes/actions based on the current user role.
2. API layer: checks role permissions before mutating mock data.

### Current Permission Summary

| Capability                   | Engineer                | Manager | Executive | Admin |
| ---------------------------- | ----------------------- | ------- | --------- | ----- |
| Login/logout                 | Yes                     | Yes     | Yes       | Yes   |
| My Work                      | Yes                     | No      | No        | No    |
| Command dashboard            | No                      | Yes     | Read-only | Yes   |
| Task update                  | Own/shared/Daily DC Ops | Yes     | No        | Yes   |
| Task assign/reassign         | No                      | Yes     | No        | Yes   |
| Incident create/work         | Yes                     | Yes     | Read-only | Yes   |
| Project task create          | No                      | Yes     | No        | Yes   |
| Assigned project task update | Yes                     | Yes     | Read-only | Yes   |
| Shift request submit         | Yes                     | No      | No        | No    |
| Shift request approve/reject | No                      | Yes     | No        | Yes   |
| Handover submit              | Yes                     | No      | No        | No    |
| Handover acknowledge/review  | No                      | Yes     | No        | Yes   |
| SOP read                     | Yes                     | Yes     | Yes       | Yes   |
| Admin user management        | No                      | No      | No        | Yes   |

Production RBAC should be enforced by the backend using authenticated sessions, not a client-supplied `actorId`.

## Audit Log Approach

The prototype audit log is implemented in `src/lib/audit-log.ts` and stores entries in memory.

Current audit entry structure includes:

- entry id
- actor id
- action
- entity type
- entity id
- before state
- after state
- timestamp
- metadata where applicable

Audited prototype actions include:

- auth login/logout
- user create/update
- task create/status/assignment
- incident create/assignment/status/escalation
- project task create/progress update
- shift request create/status update
- handover create/acknowledge/audit update
- SOP mock download

Production audit requirements:

- Store audit records durably.
- Protect audit logs from tampering.
- Define retention and archival policy.
- Include request metadata such as IP, user agent, request id, and source integration.
- Align audit categories with security and operations reporting requirements.

## Future Database / API Replacement Approach

The current service layer should be treated as the replaceable persistence boundary.

Recommended production migration path:

1. Keep route components pointed at `src/lib/backend-client.ts`.
2. Replace in-memory service methods with database-backed repository methods.
3. Add schema validation for API request bodies.
4. Replace `actorId` with authenticated session identity.
5. Add migration scripts for production tables.
6. Add API tests for permission and validation behavior.
7. Add integration tests for external systems.

Potential database options:

- PostgreSQL
- SQL Server, if aligned with enterprise standards
- Supabase, if approved
- Cloudflare D1 for lightweight edge-hosted deployments

Core production tables may include:

- users
- roles
- teams
- tasks
- incidents
- projects
- project_tasks
- shifts
- shift_requests
- handover_points
- sops
- sop_links
- audit_log
- integration_events

## Future Integration Approach

Integrations should be added through backend services, not directly from React pages.

Recommended integration pattern:

```text
External System
  |
  | webhook, scheduled sync, or API polling
  v
Integration Adapter
  |
  | normalize external event
  v
Domain Service
  |
  | create/update incident, task, project link, or dashboard metric
  v
Database + Audit Log
```

### SolarWinds

- Ingest alerts as incidents.
- Store SolarWinds alert ID in `sourceRef`.
- Enrich incidents with node/interface/device metadata.
- Sync monitoring status into dashboards.

### DCIM/DCE

- Ingest environmental and asset events.
- Link tasks/incidents to asset IDs, racks, halls, and power/cooling systems.
- Provide capacity and risk context to projects and dashboards.

### ITSM

- Sync incidents and operational tasks with service desk records.
- Link SLA and approval data.
- Support escalation and closure synchronization.

### ServiceNow

- Integrate incident, problem, change, request, and CMDB records.
- Map Ops Command Platform statuses to ServiceNow state models.
- Add governance controls for approval and change management.

## Deployment Considerations

Prototype deployment:

- Local developer machine or internal demo environment.
- `npm run dev:team` for shared local network review.
- No production data.
- No external integrations.

Production deployment requires:

- Environment strategy: dev, test, staging, production.
- CI/CD pipeline with lint, build, tests, and security scans.
- Secrets management.
- Approved authentication provider.
- Database provisioning and migration process.
- HTTPS and domain configuration.
- Observability: logs, metrics, traces, uptime checks.
- Backup and restore design.
- Audit log retention policy.
- Vulnerability management and dependency review.
- Rollback plan.
- Official approval from the accountable business, security, operations, and DevOps stakeholders.

## Security Considerations

The prototype demonstrates security intent but is not security complete.

Production must address:

- Authentication and session security.
- Authorization enforcement on every API mutation.
- Secure password handling or SSO-only access.
- Input validation and output encoding.
- CSRF/CORS strategy.
- Rate limiting and abuse controls.
- File upload scanning and storage security.
- Secure audit log storage.
- Vendor/API credential handling.
- Data classification and privacy requirements.

## Handover Notes For Developers And DevOps

- Preserve the existing UI unless a design change is explicitly approved.
- Keep role rules centralized in `src/lib/rbac.ts` or production equivalent.
- Keep frontend pages calling `backend-client.ts`, not external systems directly.
- Use the service layer as the transition point from mock data to durable persistence.
- Add automated tests before expanding production scope.
- Treat all current data as mock/demo data.
