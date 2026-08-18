# Ops Command Platform

Ops Command Platform is a unified operations workspace for Data Center and NOC teams to manage daily operations, incidents, projects, shifts, handovers, SOPs, productivity and governance from one configurable system.

The product direction is Sharjah Digital Department-style operations: professional, calm, enterprise-ready, role-aware and easy for shift engineers while still giving managers and executives a strong command view.

## Product Focus

- Operational control through Command View, My Work, Shift Control, Import Center and Configuration Center.
- Team visibility for Data Center Operations, NOC Operations, handover quality and shift coverage.
- Accountability through ownership, status badges, SLA signals, audit logs and role restrictions.
- Faster handover through multiple handover rows per date/shift and manager review.
- Configurable workflows without developer changes for templates, incident rules, roster rules, SOP settings, dashboards, imports and SLA escalation.

## Stack

- React 19
- TanStack Start and TanStack Router
- TypeScript
- Vite
- Tailwind CSS
- Radix UI primitives
- Lucide icons
- Sonner notifications
- XLSX/CSV roster import support

## Install And Run

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Type-check:

```bash
npm exec tsc -- --noEmit
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`:

```bash
npm.cmd run dev
```

## Bootstrap Accounts

Starter accounts are included only so role behavior can be tested before you add real users.

| Role       | Username    | Password    |
| ---------- | ----------- | ----------- |
| Engineer   | `engineer`  | `change-me` |
| Shift Lead | `shiftlead` | `change-me` |
| Manager    | `manager`   | `change-me` |
| Executive  | `exec`      | `change-me` |
| Admin      | `admin`     | `change-me` |

Replace these accounts before production use.

## Add Your Team Data

Primary starter data lives in:

```text
src/lib/data.ts
```

Operational record arrays are intentionally empty so you can add your own data:

- `tasks`
- `incidents`
- `projects`
- `projectTasks`
- `shifts`
- `shiftRequests`
- `handoverPoints`
- `sops`
- `productivity`
- `monthlyTrend`

The app includes editable bootstrap configuration for roles, teams, categories, statuses, shift timings and workflow rules. Replace or remove those records as you load real DC/NOC data.

The service layer lives in:

```text
src/lib/services.ts
```

When you are ready for persistence, replace repository/mock data calls with API/database calls while keeping service contracts and UI routes mostly unchanged.

## Backend Architecture And MySQL Direction

The prototype remains mock/in-memory, but the future production database direction is MySQL.

Planning documents:

- `ARCHITECTURE.md`: service/repository layering and MySQL migration approach.
- `DATABASE_SCHEMA.md`: MySQL table draft and relationships.
- `PROJECT_PLAN.md`: mock backend to MySQL migration plan.
- `.env.example`: future `DATABASE_URL` example.

No Prisma dependency was added because this project does not currently have Prisma configured. The safe next step is schema review, then adding an ORM or MySQL client after DevOps/security approval.

## Current Demo Status And Guardrails

The current prototype is intentionally stable for demo use and follows the verified operational rules below:

- Shift roster generation treats fixed-shift rules as hard constraints before off-day balancing. This prevents a fixed engineer from being overwritten by the fairness rotation logic.
- Incident creation is restricted to engineer, shift lead and admin roles. Managers can work and review incidents, but they cannot create them in the mock workflow.
- Prototype-only actions are visibly disabled when the mock backend does not yet support the action, with clear status messaging instead of silent dead buttons.
- Import Center and SOP areas remain mocked and are not treated as live database workflows.

## Configuration Center

Admin manages the platform from Configuration Center:

- Users: add, edit, deactivate, assign role/team and reset starter password.
- Roles & Permissions: enable roles and configure module visibility per role.
- Teams: add, edit, remove and assign users to teams.
- Task Templates: define reusable daily operations templates, checklist and evidence needs.
- Incident Rules: define default severity, SLA, assignment team and recommended SOPs.
- Project Templates: define standard phases/subtasks and governance gates.
- Shift & Roster Rules: define 3-shift timings, coverage rules, mandatory assignments, fairness guidance, roster rows, Excel import and monthly roster generation.
- Handover Templates: define required categories, acknowledgement rules and critical next-action behavior.
- SOP Settings: define SOP category, approval workflow, visibility and linkable modules.
- Dashboard Settings: configure widgets per role plus app name, logo placeholder, theme and module visibility.
- SLA & Escalation: define simple SLA thresholds and escalation owners.
- Categories and Statuses: manage operational labels and badge colors.
- Audit Logs: review configuration and operational change history.

Every admin/configuration action writes an audit entry.

## Import Center

Import Center provides a guided mock import flow:

1. Select import type.
2. Download CSV template.
3. Upload CSV/XLSX or use a sample file.
4. Validate data.
5. Review totals, warnings, errors and preview rows.
6. Confirm import and write audit history.

Supported import types:

- Users
- Tasks
- Incidents
- Projects
- Project Tasks/Subtasks
- Shift Roster
- Shift Requests
- Handover Points
- SOP Metadata

Role access:

- Admin: full access to all import types.
- Manager: operational imports for tasks, incidents, projects, project tasks, shift roster and handover points.
- Shift Lead: shift and operational imports for tasks, incidents, shift roster and handover points.
- Executive: read-only import history.
- Engineer: no Import Center navigation or route access.

Import Center is mock-based now and MySQL-ready conceptually. Future production writes should use `import_jobs`, `import_job_rows` and `audit_logs`.

## Shift Control

The Shift Control page uses a table-first roster layout with:

- Date
- Day
- Shift Type: Morning, Evening, Night
- Assigned Engineers
- Shift Lead
- Coverage Status
- Notes
- Actions

Supported roster features:

- Date range filter.
- Shift type filter.
- Engineer filter.
- Engineer name search.
- Current day/current shift highlight.
- "Who is on shift now" panel.
- Upcoming shifts.
- Overlap conflict detection.
- Manager/Admin roster edit actions.
- Engineer shift swap, leave early, change shift and absence requests.

Approved shift requests update the visible roster where applicable and create audit log entries.

## Roster Excel Import

Admins can import roster rows from `.xlsx` or `.csv` files in:

```text
Configuration Center > Shift & Roster Rules > Roster assignments
```

Supported columns:

- `Date`
- `Shift Type`
- `Assigned Engineers`
- `Shift Lead`
- `Coverage Status`
- `Notes`

Use `Morning`, `Evening` or `Night` for `Shift Type`. Engineers can be matched by user ID, username or full name. Separate multiple engineers with commas, semicolons or line breaks.

Default three-shift timings:

- Morning: `06:00-14:00`
- Evening: `14:00-22:00`
- Night: `22:00-06:00`

## Monthly Roster Builder

Admins can build a full month of Morning, Evening and Night roster rows in Configuration Center.

The builder supports:

- Month selection.
- Shift selection.
- Optional default assigned engineers.
- Optional default shift lead.
- Optional default note.
- Mandatory assignment rules.
- Fairness guidance summary.
- Safe default behavior that skips existing rows.
- Overwrite mode when replacing rows intentionally.

## Role Behavior

- Engineer: lands on My Work, sees assigned/shared work and own shifts, submits handover points and shift requests, cannot edit roster directly.
- Shift Lead: operational role with shift/team context based on configured permissions.
- Manager: lands on Command View, reviews coverage, audits handover, approves/rejects shift requests and can generate roster when allowed.
- Executive: read-only high-level operations summary.
- Admin: full configuration and roster control.

## UI Notes

- Page headers include clear titles, short descriptions and consistent back buttons.
- Status badges use consistent meanings: green healthy/completed, yellow pending/review, red critical/breached, blue informational/in progress, gray inactive/draft.
- Empty states are included so the app is usable while you are still loading real data.
- Light, Dark and System theme preference are supported with foreground/muted text tokens for readable controls and tables.

More setup notes are in `TEAM_DATA.md`.
