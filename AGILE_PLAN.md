# Ops Command Platform Agile Plan

## Product vision

Ops Command Platform is a role-based operations command surface for Data Center and NOC teams. The platform should help engineers, managers, executives, and admins coordinate daily work, incidents, projects, shift schedules, handovers, SOPs, reports, and audit visibility from one consistent UI.

## Guiding principles

- Preserve the existing Lovable UI and navigation.
- Build backend-ready seams incrementally; do not rewrite the app from scratch.
- Keep role behavior consistent across navigation, pages, and actions.
- Replace direct mock mutations with service-layer calls over time.
- Prefer small, testable increments with clear acceptance criteria.
- Keep mock data useful until a real backend is connected.

## Current product roles

| Role | Primary goal | Current landing page | Key access |
| --- | --- | --- | --- |
| Engineer | Execute assigned/shared operational work | `/my-work` | My Work, Tasks, Incidents, Projects, Shifts, Shift Requests, Handover, SOP Library |
| Manager | Coordinate team work and review operations | `/dashboard` | Dashboard, Tasks, Incidents, Projects, Shifts, Shift Requests, Handover review, SOP Library, Productivity, Reports |
| Executive | Review operational posture and KPIs | `/dashboard` | Executive dashboard, Incidents, Projects, SOP Library, Productivity, Reports |
| Admin | Manage users, roles, and system setup | `/admin` | Admin plus operational/management pages |

## Release roadmap

### Release 0: Stabilize mock backend-ready foundation

**Goal:** Make the current Lovable app reliable for demo/testing with service-layer actions and permission checks.

**Scope:**

- Confirm all existing pages load for allowed roles.
- Confirm disallowed direct routes redirect safely.
- Confirm mock services cover tasks, incidents, projects, shifts, shift requests, handover, SOP, auth, and audit logs.
- Document testing and operating instructions.

**Done when:**

- Build and type check pass.
- Lint has no blocking errors.
- TESTING.md and product documentation are available.
- Manual smoke flows are documented and executable.

### Release 1: Real backend adapter preparation

**Goal:** Prepare service APIs to swap mock arrays for real backend calls without redesigning UI.

**Scope:**

- Define stable service method contracts.
- Add typed DTOs for create/update operations.
- Add consistent result/error shape for service calls.
- Add persistence boundary for auth/session and audit logs.
- Add route/action permission tests for RBAC helpers.

**Done when:**

- Service methods have typed inputs and outputs.
- UI routes depend on services rather than direct mock arrays for mutations.
- RBAC helper tests cover all roles and route prefixes.

### Release 2: Backend integration

**Goal:** Connect services to a real backend while preserving the current UI.

**Scope:**

- Add environment-based backend client configuration.
- Implement auth/session persistence.
- Implement CRUD for tasks, incidents, projects/subtasks, shift schedules, shift requests, handovers, SOP metadata, and audit logs.
- Add loading/error states around service calls where needed.

**Done when:**

- Mock services can be toggled or replaced by backend adapters.
- Core role flows work against backend data.
- Audit logs persist outside browser memory.

### Release 3: Operational hardening

**Goal:** Make the platform reliable for day-to-day operational use.

**Scope:**

- Add automated integration/e2e tests for role workflows.
- Add validation for forms and service inputs.
- Add pagination/filtering for larger datasets.
- Add real file storage for evidence, incident reports, and SOP documents.
- Add notifications and SLA escalation workflows.

**Done when:**

- Critical workflows have automated coverage.
- Large datasets remain responsive.
- Attachments and downloads use real storage.

## Suggested sprint plan

### Sprint 1: Documentation and smoke testing

**Objective:** Make the current app easy to run, test, and review.

**Stories:**

1. As a reviewer, I can follow TESTING.md to run the app and validate role flows.
2. As a developer, I can understand the app architecture and service/RBAC boundaries.
3. As a product owner, I can see the prioritized roadmap and acceptance criteria.

**Acceptance criteria:**

- `TESTING.md` documents setup, run commands, credentials, scenarios, and limitations.
- `DOCUMENTATION.md` documents architecture, pages, roles, services, workflows, and future backend notes.
- `AGILE_PLAN.md` documents releases, sprint plan, backlog, and definition of done.

### Sprint 2: RBAC and service tests

**Objective:** Make permission behavior safe to change.

**Stories:**

1. As a developer, I can run tests for `canAccessPath` and action-level RBAC helpers.
2. As a manager, I can trust engineers cannot mutate work outside their scope.
3. As an executive, I can access read-only pages without mutation controls.

**Acceptance criteria:**

- Unit tests cover route access for engineer, manager, executive, and admin.
- Unit tests cover task/project/handover/SOP capabilities.
- Tests run in CI or documented local commands.

### Sprint 3: Service method consistency

**Objective:** Standardize service contracts before real backend integration.

**Stories:**

1. As a developer, I can call create/update/list methods with typed request payloads.
2. As a UI route, I can handle service errors consistently.
3. As an auditor, every mutation records an audit entry.

**Acceptance criteria:**

- Mutating services return consistent success/error objects.
- All mutations include actor id and audit event metadata.
- UI uses service responses rather than mutating imported objects directly.

### Sprint 4: Real forms for existing actions

**Objective:** Connect existing buttons to lightweight forms without redesigning UI.

**Stories:**

1. As a manager, I can create an incident with source/category/severity fields.
2. As an engineer, I can submit a handover point with date/shift/category/priority.
3. As a manager/admin, I can add a project task with title, assignee, due date, and priority.
4. As an engineer, I can update assigned project task progress.

**Acceptance criteria:**

- Existing page layouts are preserved.
- Forms validate required fields.
- Actions call service methods and record audit logs.

### Sprint 5: Backend adapter spike

**Objective:** Prove that service methods can call a backend.

**Stories:**

1. As a developer, I can switch one domain from mock data to a backend adapter.
2. As a tester, I can verify the UI still behaves the same with backend data.

**Acceptance criteria:**

- One domain, preferably tasks or incidents, uses a backend adapter behind the same service interface.
- Environment variables are documented.
- Mock mode remains available for demos.

## Prioritized backlog

| Priority | Epic | Backlog item | Notes |
| --- | --- | --- | --- |
| P0 | Documentation | Keep TESTING.md and DOCUMENTATION.md up to date | Required for review and handoff |
| P0 | Quality | Add RBAC unit tests | Prevent permission regressions |
| P0 | Quality | Add service smoke tests | Cover core create/update flows |
| P1 | Tasks | Replace temporary assignment shortcut with assignee selector | Preserve current table/action style |
| P1 | Incidents | Add create incident dialog using existing visual language | Source/category/status should be explicit |
| P1 | Handover | Add submit handover dialog | Include date, shift, category, priority, owner, next action |
| P1 | Projects | Add project task form | Include title, assignee, progress, due date |
| P2 | Audit | Add admin/report view for audit logs | Read-only first |
| P2 | SOP | Add SOP preview mock panel | Do not require real document storage yet |
| P2 | Backend | Define backend adapter interface | Keep mock service fallback |
| P3 | Reporting | Export reports from service data | Can remain mock-generated initially |
| P3 | Notifications | Add SLA/assignment notifications | Requires backend/event strategy |

## Definition of ready

A story is ready when:

- The affected role(s) are identified.
- The route/page is identified.
- Expected permissions are clear.
- Service methods needed by the story are named.
- Acceptance criteria include at least one manual or automated verification step.

## Definition of done

A story is done when:

- The existing Lovable UI design is preserved.
- Role access is enforced in navigation and direct routes/actions.
- Mutations go through service methods.
- Audit events are recorded for important mutations.
- Type check and build pass.
- Manual testing steps are documented or automated.
- Known limitations are updated if needed.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Large UI rewrite breaks Lovable design | High | Keep changes incremental and page-local |
| RBAC hidden only in UI but not services | High | Add service-level actor checks or backend enforcement in later release |
| Mock data diverges from backend schema | Medium | Introduce typed DTOs before backend integration |
| Audit logs are in-memory only | Medium | Persist audit logs in backend adapter release |
| No automated tests | Medium | Prioritize RBAC/service tests in Sprint 2 |
| Corporate network blocks preview URLs | Medium | Document cloud IDE port preview and local alternatives |

## Recommended review checklist

- Login works for engineer, manager, executive, and admin.
- Role landing pages match expectations.
- Direct unauthorized routes redirect safely.
- Engineer mutation actions are limited to assigned/shared work.
- Manager/admin controls are available on management workflows.
- Executive pages are read-only.
- Incident create/assign/accept/resolve flows work in mock mode.
- Project task add/update progress flows work in mock mode.
- Handover submit/review flows work in mock mode.
- SOP search/filter/download flows work in mock mode.
