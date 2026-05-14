# Ops Command Platform Sprint Plan

## Sprint Cadence

- Sprint length: 2 weeks
- Ceremony baseline: planning, daily standup, backlog refinement, review/demo, retrospective
- Delivery style: incremental prototype hardening followed by production integration planning
- Definition of Done:
  - Code or documentation is reviewed.
  - Acceptance criteria are met.
  - Role behavior is validated.
  - Lint/build pass where code changes exist.
  - Manual test evidence is recorded.
  - Known gaps are documented.

## Sprint 0: Discovery & Setup

### Objective

Confirm the product scope, role model, module list, repository readiness, UI baseline, and mock data structure before implementation work begins.

### User Stories

- As a product owner, I want the team to confirm the required modules so delivery can be planned clearly.
- As a developer, I want the repo and scripts validated so I can run the project locally.
- As a designer or stakeholder, I want the existing UI reviewed so the team preserves the approved Lovable interface.
- As a business owner, I want prototype assumptions documented so stakeholders do not confuse the demo with production.

### Deliverables

- Confirmed requirements and initial backlog.
- Validated user roles: Engineer, Manager, Executive, Admin.
- Confirmed module inventory.
- Repository setup instructions.
- UI review notes.
- Mock data model inventory.
- Prototype assumptions and out-of-scope list.

### Acceptance Criteria

- Team can install dependencies and start the app locally.
- Main routes and modules are identified.
- Mock users and mock data sources are documented.
- Stakeholders agree that the current phase is a functional prototype.

### Testing Checklist

- Run dependency install.
- Run local dev server.
- Open the app in the browser.
- Confirm routes render.
- Confirm mock users exist.
- Confirm no UI redesign work is introduced.

## Sprint 1: Authentication & Role Access

### Objective

Implement mock authentication, session restoration, logout, protected routes, and role-specific navigation.

### User Stories

- As an Engineer, I want to log in and land on My Work.
- As a Manager, I want to log in and land on Command View.
- As an Executive, I want read-only access to dashboard/reporting areas.
- As an Admin, I want access to administration and operational modules.
- As the business owner, I want unauthorized routes blocked by role.

### Deliverables

- Mock username/password login.
- Logout flow.
- Current user session restoration.
- Role landing page logic.
- Role-based routing.
- Role-based navigation.
- Protected route behavior.

### Acceptance Criteria

- Engineer logs in with `ahmed` / `demo` and lands on `/my-work`.
- Manager logs in with `manager` / `demo` and lands on `/dashboard`.
- Executive logs in with `exec` / `demo` and lands on `/dashboard`.
- Admin logs in with `admin` / `demo` and lands on `/admin`.
- Logged-out users are redirected to `/login`.
- Users are redirected away from unauthorized direct routes.

### Testing Checklist

- Test valid login for all roles.
- Test invalid login.
- Test logout.
- Refresh browser and confirm session restoration.
- Directly open unauthorized URLs for each role.
- Confirm navigation menus match role access.

## Sprint 2: Tasks & Daily DC Operations

### Objective

Deliver a working task flow for assigned work, manager assignment, shared Daily DC Operations tasks, and permission enforcement.

### User Stories

- As an Engineer, I want to update tasks assigned to me.
- As an Engineer, I want to update shared Daily DC Operations tasks.
- As an Engineer, I must be blocked from editing another engineer's assigned task.
- As a Manager, I want to assign and reassign tasks.
- As a Manager, I want task changes auditable.
- As an Admin, I want operational access for support and configuration.

### Deliverables

- Task data model.
- Task list and filters.
- Create/update task flow.
- Assignment and reassignment flow.
- Shared Daily DC Operations task behavior.
- Permission enforcement.
- Task audit history entries.

### Acceptance Criteria

- Tasks load from the mock service layer.
- Manager/Admin can create a task.
- Manager/Admin can assign or reassign a task.
- Engineer can update own assigned task.
- Engineer can update shared Daily DC Operations tasks.
- Engineer cannot update another engineer's assigned work.
- Task mutations create audit entries.

### Testing Checklist

- Login as Engineer and update an assigned task.
- Login as Engineer and update a shared Daily DC Operations task.
- Login as Engineer and attempt another engineer's task; confirm blocked.
- Login as Manager and assign/reassign task.
- Login as Executive and confirm edit actions are unavailable.
- Verify task counts and dashboard values update from mock data.

## Sprint 3: Incident Management

### Objective

Deliver a working incident lifecycle from creation through assignment, acceptance, progress, escalation, and resolution.

### User Stories

- As an Engineer, I want to create an incident when I identify an operational issue.
- As a Manager, I want to assign an incident to an engineer.
- As an Engineer, I want to accept an assigned incident.
- As an Engineer, I want to progress and resolve an incident.
- As a Manager, I want to escalate critical incidents.
- As an Executive, I want read-only visibility into incident status.

### Deliverables

- Incident source model.
- Incident categorization.
- Incident creation.
- Assignment flow.
- Engineer acceptance.
- In Progress status handling.
- Escalation.
- Resolution.
- Activity history/audit events.

### Acceptance Criteria

- Incident can be created from the UI.
- Incident includes source and category.
- Manager/Admin can assign incidents.
- Engineer can accept, progress, and resolve incidents.
- Engineer/Manager/Admin can escalate incidents.
- Executive can view incidents without edit controls.
- Incident mutations are reflected in the table and dashboard mock data.

### Testing Checklist

- Create incident as Engineer.
- Create incident as Manager.
- Assign incident as Manager.
- Accept incident as Engineer.
- Move incident to In Progress.
- Resolve incident.
- Escalate incident.
- Login as Executive and confirm read-only behavior.

## Sprint 4: Project & Subtask Management

### Objective

Deliver project list/detail views and project task/subtask progress tracking with role-based permissions.

### User Stories

- As a Manager, I want to view project status and risk.
- As a Manager, I want to add project tasks/subtasks.
- As an Engineer, I want to update progress on tasks assigned to me.
- As an Executive, I want read-only project portfolio visibility.
- As an Admin, I want access to support project configuration.

### Deliverables

- Project data model.
- Project list/detail.
- Project tasks/subtasks.
- Kanban view.
- Progress calculation.
- Risk tracking.
- Role-based project permissions.

### Acceptance Criteria

- Project list loads from mock service data.
- Project detail loads tasks/subtasks.
- Manager/Admin can add project tasks.
- Assigned Engineer can update project task progress.
- Project progress recalculates from subtask completion.
- Executive can view project data without edit controls.

### Testing Checklist

- Open project list as Manager.
- Open project detail.
- Add project task as Manager.
- Update project task progress.
- Confirm project completion changes.
- Login as Engineer and update only assigned project tasks.
- Login as Executive and confirm read-only behavior.

## Sprint 5: Shift Schedule & Shift Requests

### Objective

Deliver morning/night shift visibility, live shift tracking, and manager-approved shift request workflows.

### User Stories

- As an Engineer, I want to see my current shift information.
- As an Engineer, I want to create a shift swap request.
- As an Engineer, I want to create a leave early request.
- As a Manager, I want to approve or reject pending shift requests.
- As a Manager, I want to see team shift coverage.

### Deliverables

- Morning/Night shift model.
- Live shift tracker.
- Shift schedule.
- Shift swap request.
- Leave early request.
- Manager approval/rejection.
- Shift request audit events.

### Acceptance Criteria

- Shift schedule loads for the team.
- Engineer can create shift request.
- Manager/Admin can approve or reject request.
- Engineer cannot approve/reject requests.
- Executive does not have shift request mutation access.
- Shift request status updates are visible.

### Testing Checklist

- Login as Engineer and view shifts.
- Create shift swap request.
- Create leave early request.
- Login as Manager and approve request.
- Reject a request.
- Confirm Engineer cannot approve/reject directly.
- Confirm status and manager approval fields update.

## Sprint 6: Shift Handover

### Objective

Deliver multi-point handover submission, date/shift categorization, incoming acknowledgement, manager review, and handover quality metrics.

### User Stories

- As an Engineer, I want to submit multiple handover points for my shift.
- As an Engineer, I want handover points categorized by date, shift, priority, and type.
- As a Manager, I want to acknowledge incoming handover items.
- As a Manager, I want to approve or request updates on handover quality.
- As an Executive, I want high-level handover quality metrics through dashboards where appropriate.

### Deliverables

- Multi-point handover form.
- Date/shift categorization.
- Incoming acknowledgement.
- Manager review/audit.
- Handover quality metrics.
- Handover audit events.

### Acceptance Criteria

- Engineer can submit multiple handover rows.
- Manager cannot submit handover rows.
- Manager/Admin can acknowledge handover.
- Manager/Admin can approve or mark Needs Update.
- Handover metrics update from mock handover data.

### Testing Checklist

- Login as Engineer.
- Add two handover rows.
- Submit handover.
- Login as Manager.
- Confirm submit form is not available.
- Acknowledge a row.
- Approve a row.
- Mark a row Needs Update.
- Verify dashboard/handover metrics update.

## Sprint 7: SOP Library / Knowledge Base

### Objective

Deliver searchable SOP content and establish the pattern for linking knowledge items to operational work.

### User Stories

- As an Engineer, I want to search SOPs during operational work.
- As a Manager, I want SOPs to show approval status.
- As an Engineer, I want SOPs linked to incidents, tasks, projects, or handovers.
- As an Executive, I want read-only access to SOP content.
- As an Admin, I want the future ability to manage SOP metadata.

### Deliverables

- SOP data model.
- SOP search/filter.
- Mock preview/download.
- SOP approval status.
- Link model for SOPs to incidents/tasks/projects/handovers.

### Acceptance Criteria

- SOP list loads from mock data.
- Search filters SOPs by title/content metadata.
- Category and document type filters work.
- Preview/download action provides mock feedback.
- Executive access is read-only.
- SOP linking model is documented for future backend work.

### Testing Checklist

- Search SOPs by keyword.
- Filter by category.
- Filter by document type.
- Trigger mock download.
- Login as Executive and confirm read-only access.
- Confirm managers/admins see intended management actions if present.

## Sprint 8: Dashboards & Reporting

### Objective

Deliver role-specific dashboards and reports connected to mock operational data.

### User Stories

- As a Manager, I want a Command View with open work, SLA breaches, incidents, and handover metrics.
- As an Executive, I want a read-only dashboard focused on portfolio and operational health.
- As an Engineer, I want My Work to summarize my tasks, incidents, handovers, and shift context.
- As a Manager, I want productivity and SLA metrics.
- As an Executive, I want reports that support leadership review.

### Deliverables

- Manager dashboard.
- Executive dashboard.
- Engineer My Work.
- Productivity metrics.
- SLA metrics.
- Reports pages.
- Charts connected to mock data.

### Acceptance Criteria

- Dashboard values come from mock service data where operational data exists.
- Manager dashboard is not shown to Engineer.
- Executive dashboard is read-only.
- Engineer My Work shows engineer-specific work.
- Reports and productivity pages render without disconnected hardcoded operational values.

### Testing Checklist

- Login as Manager and review Command View.
- Login as Executive and review dashboard.
- Login as Engineer and review My Work.
- Create/update tasks/incidents and confirm related metrics move where applicable.
- Confirm charts render.
- Confirm no edit actions appear for Executive.

## Sprint 9: Governance, Audit & Testing

### Objective

Standardize audit behavior, verify permissions, align the prototype with governance principles, fix defects, and finalize handover documentation.

### User Stories

- As a security stakeholder, I want role permissions tested and documented.
- As an operations manager, I want key actions recorded in an audit log.
- As a developer, I want a clear test checklist for regression validation.
- As a product owner, I want ISO alignment considerations documented.
- As a DevOps engineer, I want deployment considerations documented before production planning.

### Deliverables

- Audit log standardization.
- Permission testing.
- ISO 27001 alignment review.
- ISO 27500 usability review.
- Test checklist.
- Bug fixing.
- Documentation finalization.

### Acceptance Criteria

- Core workflow actions create audit entries in the prototype model.
- Manual RBAC tests pass for Engineer, Manager, Executive, and Admin.
- Known gaps are documented.
- `npm run lint` and `npm run build` pass for code changes.
- `README.md`, `PROJECT_PLAN.md`, `SPRINT_PLAN.md`, `TESTING.md`, and `ARCHITECTURE.md` are ready for handover.

### Testing Checklist

- Run full role-based test suite in `TESTING.md`.
- Verify forbidden actions are blocked.
- Verify audit entries are recorded for core mutations.
- Run lint/build.
- Review documentation with developer, DevOps, manager, and product owner representatives.
- Record open production readiness gaps.

## Cross-Sprint Backlog

- Replace mock authentication with approved auth provider.
- Replace in-memory mock data with database persistence.
- Add automated unit/API/UI tests.
- Add CI/CD pipeline.
- Add real file storage.
- Add production audit log persistence.
- Add SolarWinds integration.
- Add DCIM/DCE integration.
- Add ITSM/ServiceNow integration.
- Add monitoring, logging, backup, and recovery design.
