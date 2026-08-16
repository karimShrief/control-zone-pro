# Ops Command Platform

Ops Command Platform is a React + TanStack Start operations workspace for DC, NOC, shift, incident, handover, SOP, project and admin workflows.

The app keeps the existing structure and uses a lightweight service layer so you can replace the starter data with your real team data or later connect a backend without rebuilding the UI.

## What Is Included

- Role-based login and navigation for Engineer, Shift Lead, Manager, Executive and Admin.
- Operational pages for dashboards, tasks, incidents, projects, shift roster, shift requests, handover, SOPs, productivity and reports.
- Admin configuration tabs for Users, Roles & Permissions, Teams, Shift Settings, Categories, Statuses and System Settings.
- Shift Roster table with filtering, search, current-shift visibility, upcoming shifts, monthly roster building, Excel import and conflict detection.
- Consistent page back buttons through the shared page header.
- Light, Dark and System theme preference with readable foreground and muted text colors.
- Audit log entries for admin changes, roster changes and shift request decisions.

## Project Stack

- React 19
- TanStack Start and TanStack Router
- TypeScript
- Vite
- Tailwind CSS
- Radix UI primitives
- Lucide icons
- Sonner notifications
- XLSX roster import support

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

Starter accounts are provided only so each role can be tested before your real user data is added.

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

Use this file to add or import your real records:

- `users`: engineers, shift leads, managers, executives and admins.
- `teamConfigs`: teams such as DC Team, NOC Team and Shared Operations.
- `shifts`: roster rows for Morning, Evening and Night shifts.
- `shiftTypeConfigs`: shift start/end times and minimum staffing.
- `coverageRules`: lead and overlap rules.
- `categoryConfigs`: task, incident, project, SOP and handover categories.
- `statusConfigs`: status labels and badge tones.
- `systemSettings`: app name, logo placeholder, theme preference and enabled modules.

The service layer lives in:

```text
src/lib/services.ts
```

That file centralizes create, update, delete/deactivate and approval actions. When you are ready for a database or API, replace the service methods there while keeping the UI routes mostly unchanged.

More setup notes are in `TEAM_DATA.md`.

## Admin Capabilities

Admin can manage:

- Users: add, edit, deactivate, assign role/team and reset starter password.
- Roles & Permissions: enable roles and configure module visibility per role.
- Teams: add, edit, remove and assign users to teams.
- Shift Settings: edit Morning/Evening/Night start/end times, enabled state, minimum engineers, coverage rules, monthly roster generation, roster rows and Excel roster imports.
- Categories: add, edit and remove operational categories.
- Statuses: add, edit and remove status labels and badge tones.
- System Settings: app name, logo placeholder, theme preference, enabled modules and role navigation visibility.

Admin changes write entries to Recent Admin Activity through `src/lib/audit-log.ts`.

## Shift Roster

The Shift Roster page displays:

- Date
- Day
- Shift Type
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

Approved shift requests update the visible roster when applicable and create audit log entries.

## Roster Excel Import

Admins can import roster rows from `.xlsx` or `.csv` files in Admin Configuration > Shift Settings > Roster assignments.

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

Admins can generate roster rows for a full month in Admin Configuration > Shift Settings > Monthly roster builder.

The builder supports:

- Month selection.
- Morning, Evening and Night shift selection.
- Optional default assigned engineers.
- Optional default shift lead.
- Optional default note.
- Safe default behavior that skips existing rows.
- Overwrite mode when Admin wants to replace existing rows for that month.

## Handover

Engineers can submit multiple handover rows for the same date and shift in one batch. Each row has its own title, category, priority, related reference, next action and notes.

Managers and Admins can review handover rows and update audit status without submitting handover as a manager action.

## Role Behavior

- Engineer: view own work and own shifts, view allowed current roster, submit shift requests, no direct roster editing.
- Shift Lead: operational role with shift/team context based on configured permissions.
- Manager: full operational visibility, coverage review and shift request approval/rejection.
- Executive: read-only high-level summaries.
- Admin: full configuration and roster control.

## Notes For Backend Integration

- The current data layer is intentionally simple and in-memory.
- Keep stable IDs for users, teams, shifts and operational records.
- Use `users[].id` for owners, assignees, shift engineers and shift leads.
- Use `teamConfigs[].id` for user team assignment.
- Replace service methods with API calls before production persistence is required.
