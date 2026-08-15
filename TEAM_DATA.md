# Team Data Setup

The app is ready for your real Data Center and NOC team data. Operational records are intentionally empty; bootstrap users and editable configuration exist only so you can test roles and configure the system before connecting a backend.

## Main File

Edit:

```text
src/lib/data.ts
```

Use stable IDs because records reference each other by ID.

## People And Teams

Start with:

- `users`: engineers, shift leads, managers, executives and admins.
- `teamConfigs`: teams such as DC Team, NOC Team and Shared Operations.
- `roleConfigs`: module access per role.

Example user:

```ts
{
  id: "u10",
  username: "first.last",
  password: "change-me",
  name: "First Last",
  role: "engineer",
  team: "DC",
  status: "Active",
}
```

## Operational Records

These arrays are ready for your real records:

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
- `importJobs`
- `importJobRows`

You can fill them directly during early testing or replace the service methods in `src/lib/services.ts` with API calls later.

## Configuration Records

Admins can edit these through Configuration Center:

- `taskTemplates`: recurring Daily DC/NOC work templates, checklist and evidence rules.
- `incidentRules`: category-based severity, SLA, assignment team and recommended SOP rules.
- `projectTemplates`: standard project phases/subtasks and governance gates.
- `rosterRules`: work/off pattern, mandatory engineer/shift and fairness guidance.
- `handoverTemplates`: required categories, acknowledgement and critical next-action rules.
- `sopSettings`: SOP approval workflow, visibility and linkable modules.
- `dashboardWidgetSettings`: role-specific widget visibility and governance indicators.
- `slaEscalationPolicies`: threshold minutes and escalation owners.
- `importTemplateDefinitions`: CSV/XLSX-style import templates and role access.
- `categoryConfigs`: task, incident, project, SOP and handover categories.
- `statusConfigs`: status labels and badge tones.
- `systemSettings`: app name, logo placeholder, theme preference and enabled modules.

Generic starter configuration can be replaced or removed. It is not production team data.

## Shift Timings

Configure the three shifts in `shiftTypeConfigs` or through Configuration Center:

- Morning
- Evening
- Night

Each shift type supports:

- Start time
- End time
- Required minimum engineers
- Enabled/disabled state

Coverage rules live in `coverageRules`:

- Require shift lead
- Prevent overlapping assignments
- Default minimum engineers

## Roster Excel Import

Admins can import `.xlsx` or `.csv` roster files from:

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

Use `Morning`, `Evening` or `Night` as shift types. People can be matched by:

- `users[].id`
- `users[].username`
- `users[].name`

Separate multiple assigned engineers with commas, semicolons or line breaks.

## Import Center Templates

Import Center supports mock templates for:

- Users
- Tasks
- Incidents
- Projects
- Project Tasks/Subtasks
- Shift Roster
- Shift Requests
- Handover Points
- SOP Metadata

Templates are defined in `importTemplateDefinitions`. The current mock flow validates sample rows and records import history. Future MySQL implementation should write import batches to `import_jobs` and row results to `import_job_rows`.

## Monthly Roster Builder

Admins can build roster rows across a month from:

```text
Configuration Center > Shift & Roster Rules > Monthly roster builder
```

The builder can:

- Create Morning/Evening/Night rows for the selected month.
- Skip existing rows by default.
- Overwrite rows only when explicitly enabled.
- Apply active mandatory assignment rules.
- Return a fairness summary for review before publishing.

## Shift Requests

Engineers and shift leads can submit:

- Shift swap
- Leave early
- Change shift
- Absence note

Managers/Admins can approve or reject. Approved swap/change requests update the roster where applicable and create audit entries.

## Service Layer

Business behavior is centralized in:

```text
src/lib/services.ts
```

Replace the in-memory arrays with API/database calls here when you are ready for persistence. Keep route/component contracts stable where possible.

## Audit Log

Audit logging lives in:

```text
src/lib/audit-log.ts
```

Configuration changes, roster modifications, generated template work, handover audit updates and shift request decisions write audit entries.
