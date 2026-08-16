# Team Data Setup

The app is now wired to a neutral starter data module that you can replace with your real team data.

## Where to add your team data

Edit `src/lib/data.ts`.

Start with these exports:

- `users`: your engineers, shift leads, managers, executives and admins.
- `teamConfigs`: your real team names and descriptions.
- `shifts`: published roster rows.
- `shiftTypeConfigs`: shift names, start/end times and minimum coverage.
- `coverageRules`: default coverage rules.
- `categoryConfigs`: categories for tasks, incidents, projects, SOPs and handover.
- `statusConfigs`: status labels and badge tones.
- `systemSettings`: app name, enabled modules and navigation visibility.

Operational record arrays are intentionally empty:

- `tasks`
- `incidents`
- `projects`
- `projectTasks`
- `shiftRequests`
- `handoverPoints`
- `sops`
- `productivity`
- `monthlyTrend`

Fill those arrays from your own source, or replace the service methods in `src/lib/services.ts`
with API calls later.

## Shift roster import

Admin can import `.xlsx` or `.csv` roster files from Admin Configuration > Shift Settings.

Use these columns:

- `Date`
- `Shift Type`
- `Assigned Engineers`
- `Shift Lead`
- `Coverage Status`
- `Notes`

Use `Morning`, `Evening` or `Night` as shift types. The importer matches people by `users[].id`,
`users[].username` or `users[].name`.

## Monthly roster builder

Admin can also build a full month of roster rows from Admin Configuration > Shift Settings.

The builder creates rows for the selected month and selected shifts. By default it skips existing
rows, so it is safe to use after manual edits. Enable overwrite only when you intentionally want to
replace existing rows for that month.

## Bootstrap logins

The app includes neutral bootstrap users so you can test role access:

- `engineer`
- `shiftlead`
- `manager`
- `exec`
- `admin`

Starter password: `change-me`

Replace these accounts before production use.

## ID references

Use stable IDs consistently:

- Assign task, incident, project, shift and handover owners using `users[].id`.
- Assign users to teams using `teamConfigs[].id`.
- Assign shift engineers using `users[].id`.

Example:

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
