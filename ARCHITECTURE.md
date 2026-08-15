# Ops Command Platform Architecture

## Current Prototype

The app currently runs as a mock-data prototype:

- UI routes/components render the operational workflows.
- `src/lib/services.ts` exposes service APIs such as `taskService`, `incidentService`, `projectService`, `shiftService`, `handoverService`, `sopService`, `importService` and `auditService`.
- `src/lib/data.ts` stores bootstrap users, configuration records and empty operational arrays.
- `src/lib/repositories/mock-database.ts` introduces a repository boundary for Import Center history and rows.
- `src/lib/audit-log.ts` keeps audit events in memory.

This keeps the app functional without requiring a database server.

## Target Production Direction

Future production persistence should use MySQL.

Recommended layers:

1. UI components and routes
2. Service layer
3. Repository/data access layer
4. Mock database implementation for prototype/dev
5. MySQL implementation for production

The UI should keep calling services. Services should call repositories. Replacing the mock repository with MySQL queries should not require rewriting page components.

## Service Boundary

Keep these service contracts stable where possible:

- `taskService`
- `incidentService`
- `projectService`
- `shiftService`
- `shiftRequestService`
- `handoverService`
- `sopService`
- `importService`
- `auditService`
- Admin/configuration services

When MySQL is introduced, repository implementations should own SQL/ORM calls and return the same domain shapes expected by these services.

## Repository Boundary

The initial repository boundary is in:

```text
src/lib/repositories/
```

Current files:

- `types.ts`: repository contracts.
- `mock-database.ts`: mock repository implementation over in-memory arrays.

Recommended future files:

- `mysql-database.ts`: MySQL-backed implementation.
- `repository-provider.ts`: chooses mock or MySQL implementation by environment.

## Import Center Readiness

Import Center is structured for future MySQL persistence:

- Prototype import jobs use mock repository storage.
- Future `import_jobs` stores the batch/job.
- Future `import_job_rows` stores each uploaded row and validation result.
- Audit events are logged for template download, upload, validation, confirm, failure and cancellation.

## Audit Log Readiness

Prototype audit events are in memory. Future MySQL should persist:

- `action`
- `module`
- `entity_type`
- `entity_id`
- `changed_by_user_id`
- `old_value`
- `new_value`
- `reason`
- `created_at`

Use MySQL `JSON` columns when approved. Use `TEXT` if the production MySQL version or governance process prefers plain serialized JSON.

## Environment

Future database URL:

```env
DATABASE_URL="mysql://user:password@host:3306/ops_command_platform"
```

Do not commit real credentials. Use `.env.example` only.

## Deployment Notes

- Keep prototype mock mode available for demos and local testing.
- Add MySQL only after schema review.
- Add migration tooling only after the ORM/client choice is confirmed.
- Protect production credentials through approved DevOps/security processes.
