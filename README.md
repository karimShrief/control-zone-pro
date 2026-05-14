# Ops Command Platform

Ops Command Platform is a functional prototype for Data Center and NOC operations teams. It provides one role-aware workspace for daily work, incidents, projects, shifts, handover, SOPs, reporting, and administration.

The current version uses mock data and a local server-backed service layer. It is suitable for internal demos, workflow validation, developer handover, and planning the production backend. It is not production-ready until security, database, API integration, deployment, and official approval work is completed.

## Purpose

The platform is intended to help operations teams:

- See assigned work and shared Daily DC Operations tasks.
- Track incidents from creation through assignment, acceptance, escalation, and resolution.
- Manage projects and subtasks with progress tracking.
- Manage morning/night shifts and shift requests.
- Submit and review shift handover points.
- Access SOPs and knowledge base content.
- Review role-specific dashboards and reports.
- Manage prototype users and roles through an admin area.

## Main Modules

- Authentication and role-based access
- Engineer My Work
- Tasks and Daily DC Operations
- Incident Management
- Project and Subtask Management
- Shift Schedule and Shift Requests
- Shift Handover
- SOP Library / Knowledge Base
- Manager and Executive Dashboards
- Reports and Productivity Metrics
- Admin User Management
- Audit logging for core mock actions

## Tech Stack

- React 19
- TanStack Start
- TanStack Router
- Vite
- TypeScript
- Tailwind CSS
- Radix UI primitives
- Recharts
- Sonner toasts
- In-memory mock service layer
- Local `/api` routes served by the TanStack Start server

## Install

Recommended:

```bash
npm install
```

The repo may also contain a Bun lockfile. If the team prefers Bun:

```bash
bun install
```

## Run Locally

Start the local team demo server:

```bash
npm run dev:team
```

Open:

```text
http://localhost:8080/
```

If port `8080` is already in use, Vite may print a different port. Use the URL shown in the terminal.

## Mock Login Credentials

All mock users use password `demo`.

| Role      | Username  | Password | Expected landing page |
| --------- | --------- | -------- | --------------------- |
| Engineer  | `ahmed`   | `demo`   | `/my-work`            |
| Manager   | `manager` | `demo`   | `/dashboard`          |
| Executive | `exec`    | `demo`   | `/dashboard`          |
| Admin     | `admin`   | `demo`   | `/admin`              |

Additional engineer accounts may exist in mock data for assignment checks.

## Basic Testing Steps

1. Run `npm install`.
2. Run `npm run dev:team`.
3. Open `http://localhost:8080/`.
4. Log in as each role: Engineer, Manager, Executive, Admin.
5. Confirm each role lands on the correct page.
6. Confirm unauthorized routes redirect away.
7. Test core flows:
   - Engineer updates assigned and shared Daily DC Operations tasks.
   - Engineer is blocked from editing another engineer's assigned work.
   - Manager assigns or reassigns tasks.
   - Incident can be created, assigned, accepted, progressed, and resolved.
   - Project task can be added and updated.
   - Engineer submits handover rows.
   - Manager acknowledges and reviews handover.
   - Manager is blocked from submitting handover.
   - Admin adds and updates users.
8. Run:

```bash
npm run lint
npm run build
```

There is currently no formal automated test suite. Use `TESTING.md` for the manual validation checklist.

## Documentation Map

- `PROJECT_PLAN.md` - project objective, scope, assumptions, integrations, ISO alignment, and success criteria.
- `SPRINT_PLAN.md` - 2-week Agile sprint plan from discovery through governance and testing.
- `TESTING.md` - role-based test scenarios and manual QA checklist.
- `ARCHITECTURE.md` - frontend, mock backend, data model, RBAC, audit, deployment, and future integration approach.
- `BACKEND.md` - API endpoint and server-backed prototype details, if maintained by the team.
- `CODE_WALKTHROUGH.md` - code-level explanation, if maintained by the team.

## Production Readiness Notice

This repository is a functional prototype using mock data. A production release requires:

- Security review and approved authentication/session design.
- Durable database and migration strategy.
- Backend API integration with official systems.
- Role and permission review with the business owner.
- Deployment architecture and CI/CD pipeline.
- Audit log persistence and retention policy.
- Integration testing, UAT, and operational approval.
- Official approval from the responsible business, security, and operations stakeholders.
