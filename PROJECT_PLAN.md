# Project Plan

## Current Phase

Ops Command Platform is a working mock-data prototype for Data Center and NOC operations. The priority is to keep the demo functional while preparing the architecture for future MySQL persistence.

## Near-Term Product Priorities

- Keep role-based navigation and permissions stable.
- Continue improving operational clarity for Engineer, Shift Lead, Manager, Executive and Admin.
- Use Import Center to validate how real team data will enter the platform.
- Keep Configuration Center as the place for templates, rules, permissions and governance settings.
- Preserve audit logging for admin/configuration/import actions.

## MySQL Readiness Priorities

- Keep UI routes calling services, not raw data arrays.
- Move data access behind repository contracts gradually.
- Keep mock repositories available for local demo mode.
- Add a MySQL repository implementation only after schema review.
- Keep service function signatures stable during the migration.

## Mock Backend to MySQL Migration Plan

1. Finalize data model.
2. Validate MySQL schema with developer/DevOps.
3. Create MySQL database.
4. Configure `DATABASE_URL`.
5. Add ORM or database client.
6. Replace repository mock functions with MySQL queries.
7. Keep service function contracts unchanged.
8. Add authentication/session persistence.
9. Add audit log persistence.
10. Test role-based permissions.
11. Perform security review before production.

## Recommended Technical Steps

- Start with read-only repositories for users, roles, teams and configuration.
- Migrate audit logs early so governance history is persistent.
- Migrate Import Center next because it already matches future `import_jobs` and `import_job_rows`.
- Migrate operational modules in this order: tasks, incidents, projects, shifts, handovers, SOPs.
- Add automated tests for role permissions and service contracts before swapping repositories.

## Security Notes

- Do not commit real database credentials.
- Store production secrets in approved infrastructure/DevOps tooling.
- Hash passwords with a production-grade algorithm before real authentication is enabled.
- Add server-side authorization checks for every create/update/delete action.
- Review import validation rules before allowing production writes.

## Deployment Considerations

- Keep mock mode available for local demos and offline reviews.
- Production should use MySQL with backups and access controls.
- Import jobs should be traceable and recoverable.
- Audit logs should be append-only from the application perspective.
- File uploads/evidence should use approved object storage, with metadata stored in MySQL.
