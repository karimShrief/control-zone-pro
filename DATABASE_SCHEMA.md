# MySQL Schema Draft

This is a planning draft for the future production database. The current app still runs with mock/in-memory data.

## ID And Field Conventions

- Use `CHAR(36)` UUIDs unless the team standardizes on auto-increment IDs.
- Use `created_at` and `updated_at` on mutable tables.
- Use `deleted_at` or `is_active` for soft delete.
- Store relational data in join/detail tables instead of nested objects.
- Keep status, role, priority, severity and audit action values consistent with the TypeScript model.

## Core

```sql
CREATE TABLE roles (
  id VARCHAR(40) PRIMARY KEY,
  label VARCHAR(120) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id CHAR(36) PRIMARY KEY,
  permission_key VARCHAR(120) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE role_permissions (
  role_id VARCHAR(40) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE teams (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  username VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  display_name VARCHAR(180) NOT NULL,
  role_id VARCHAR(40) NOT NULL,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  avatar_url VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE user_teams (
  user_id CHAR(36) NOT NULL,
  team_id CHAR(36) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, team_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);
```

## Operations

```sql
CREATE TABLE tasks (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  description TEXT,
  task_type VARCHAR(80) NOT NULL,
  category VARCHAR(120),
  priority ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  impact ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  status VARCHAR(80) NOT NULL,
  assignee_user_id CHAR(36) NULL,
  created_by_user_id CHAR(36) NULL,
  due_date DATE NULL,
  sla_status ENUM('On Track','At Risk','Breached') NOT NULL DEFAULT 'On Track',
  audit_status ENUM('Pending','Approved','Needs Update') NOT NULL DEFAULT 'Pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (assignee_user_id) REFERENCES users(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE task_comments (
  id CHAR(36) PRIMARY KEY,
  task_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  comment_text TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE task_evidence (
  id CHAR(36) PRIMARY KEY,
  task_id CHAR(36) NOT NULL,
  uploaded_by_user_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

CREATE TABLE incidents (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  description TEXT,
  source_type VARCHAR(80),
  source_ref VARCHAR(160),
  category VARCHAR(120),
  subcategory VARCHAR(160),
  severity ENUM('SEV-1','SEV-2','SEV-3','SEV-4') NOT NULL DEFAULT 'SEV-3',
  status VARCHAR(80) NOT NULL,
  assignee_user_id CHAR(36) NULL,
  sla_status ENUM('On Track','At Risk','Breached') NOT NULL DEFAULT 'On Track',
  resolution TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at DATETIME NULL,
  FOREIGN KEY (assignee_user_id) REFERENCES users(id)
);

CREATE TABLE incident_activity (
  id CHAR(36) PRIMARY KEY,
  incident_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  action VARCHAR(120) NOT NULL,
  details JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE incident_comments (
  id CHAR(36) PRIMARY KEY,
  incident_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  comment_text TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE projects (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(220) NOT NULL,
  description TEXT,
  project_type VARCHAR(100),
  owner_user_id CHAR(36) NULL,
  sponsor_user_id CHAR(36) NULL,
  team_id CHAR(36) NULL,
  priority ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  impact ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  status VARCHAR(80) NOT NULL,
  start_date DATE NULL,
  target_date DATE NULL,
  completion TINYINT UNSIGNED NOT NULL DEFAULT 0,
  risk_level ENUM('Low','Medium','High') NOT NULL DEFAULT 'Low',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id),
  FOREIGN KEY (sponsor_user_id) REFERENCES users(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE project_tasks (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT,
  assignee_user_id CHAR(36) NULL,
  status VARCHAR(80) NOT NULL,
  priority ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  due_date DATE NULL,
  dependency_task_id CHAR(36) NULL,
  completion TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (assignee_user_id) REFERENCES users(id),
  FOREIGN KEY (dependency_task_id) REFERENCES project_tasks(id)
);

CREATE TABLE project_comments (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  comment_text TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Shift And Handover

```sql
CREATE TABLE shifts (
  id CHAR(36) PRIMARY KEY,
  name ENUM('Morning','Evening','Night') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  min_engineers INT NOT NULL DEFAULT 3,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE shift_rosters (
  id CHAR(36) PRIMARY KEY,
  roster_date DATE NOT NULL,
  shift_id CHAR(36) NOT NULL,
  shift_lead_user_id CHAR(36) NULL,
  coverage_status ENUM('Covered','Understaffed','Pending Update','Conflict') NOT NULL DEFAULT 'Pending Update',
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_roster_shift (roster_date, shift_id),
  FOREIGN KEY (shift_id) REFERENCES shifts(id),
  FOREIGN KEY (shift_lead_user_id) REFERENCES users(id)
);

CREATE TABLE shift_assignments (
  id CHAR(36) PRIMARY KEY,
  roster_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  assignment_role VARCHAR(80) DEFAULT 'Engineer',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_assignment (roster_id, user_id),
  FOREIGN KEY (roster_id) REFERENCES shift_rosters(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE shift_requests (
  id CHAR(36) PRIMARY KEY,
  requester_user_id CHAR(36) NOT NULL,
  request_type VARCHAR(80) NOT NULL,
  requested_date DATE NOT NULL,
  current_shift_id CHAR(36) NULL,
  requested_shift_id CHAR(36) NULL,
  reason TEXT,
  status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  manager_user_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_user_id) REFERENCES users(id),
  FOREIGN KEY (current_shift_id) REFERENCES shifts(id),
  FOREIGN KEY (requested_shift_id) REFERENCES shifts(id),
  FOREIGN KEY (manager_user_id) REFERENCES users(id)
);

CREATE TABLE handovers (
  id CHAR(36) PRIMARY KEY,
  handover_date DATE NOT NULL,
  shift_id CHAR(36) NOT NULL,
  submitted_by_user_id CHAR(36) NOT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'Open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES shifts(id),
  FOREIGN KEY (submitted_by_user_id) REFERENCES users(id)
);

CREATE TABLE handover_points (
  id CHAR(36) PRIMARY KEY,
  handover_id CHAR(36) NOT NULL,
  title VARCHAR(220) NOT NULL,
  category VARCHAR(120),
  priority ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  related_ref VARCHAR(120),
  next_action TEXT,
  notes TEXT,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  audit_status ENUM('Pending','Approved','Needs Update') NOT NULL DEFAULT 'Pending',
  owner_user_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (handover_id) REFERENCES handovers(id),
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);
```

## Knowledge

```sql
CREATE TABLE sop_categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE sop_documents (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  document_type VARCHAR(120),
  category_id CHAR(36) NULL,
  tags JSON NULL,
  version VARCHAR(40),
  approval_status VARCHAR(80) NOT NULL,
  last_updated DATE NULL,
  created_by_user_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES sop_categories(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE sop_links (
  id CHAR(36) PRIMARY KEY,
  sop_document_id CHAR(36) NOT NULL,
  linked_entity_type VARCHAR(80) NOT NULL,
  linked_entity_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sop_document_id) REFERENCES sop_documents(id)
);
```

## Configuration

```sql
CREATE TABLE task_templates (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(220) NOT NULL,
  description TEXT,
  task_type VARCHAR(80),
  recurrence VARCHAR(40),
  owner_team_id CHAR(36) NULL,
  checklist JSON NULL,
  evidence_required BOOLEAN NOT NULL DEFAULT FALSE,
  shared_daily_operation BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (owner_team_id) REFERENCES teams(id)
);

CREATE TABLE incident_rules (
  id CHAR(36) PRIMARY KEY,
  category VARCHAR(120) NOT NULL,
  default_severity ENUM('SEV-1','SEV-2','SEV-3','SEV-4') NOT NULL,
  sla_minutes INT NOT NULL,
  assignment_team_id CHAR(36) NULL,
  recommended_sop_id CHAR(36) NULL,
  escalation_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (assignment_team_id) REFERENCES teams(id),
  FOREIGN KEY (recommended_sop_id) REFERENCES sop_documents(id)
);

CREATE TABLE project_templates (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(220) NOT NULL,
  description TEXT,
  default_team_id CHAR(36) NULL,
  phases JSON NULL,
  governance_gate TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (default_team_id) REFERENCES teams(id)
);

CREATE TABLE handover_templates (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(220) NOT NULL,
  description TEXT,
  required_categories JSON NULL,
  requires_acknowledgement BOOLEAN NOT NULL DEFAULT TRUE,
  critical_requires_next_action BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE shift_rules (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(220) NOT NULL,
  description TEXT,
  rule_type VARCHAR(80),
  rule_payload JSON NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE roster_rules (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(220) NOT NULL,
  description TEXT,
  work_pattern VARCHAR(220),
  mandatory_user_id CHAR(36) NULL,
  mandatory_shift_id CHAR(36) NULL,
  fairness_target TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (mandatory_user_id) REFERENCES users(id),
  FOREIGN KEY (mandatory_shift_id) REFERENCES shifts(id)
);

CREATE TABLE dashboard_widget_configs (
  id CHAR(36) PRIMARY KEY,
  role_id VARCHAR(40) NOT NULL,
  widget_key VARCHAR(120) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  governance_signal VARCHAR(120),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE sla_rules (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(220) NOT NULL,
  applies_to VARCHAR(80) NOT NULL,
  threshold_minutes INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE escalation_rules (
  id CHAR(36) PRIMARY KEY,
  sla_rule_id CHAR(36) NULL,
  escalation_owner_team_id CHAR(36) NULL,
  escalation_owner_user_id CHAR(36) NULL,
  escalation_order INT NOT NULL DEFAULT 1,
  FOREIGN KEY (sla_rule_id) REFERENCES sla_rules(id),
  FOREIGN KEY (escalation_owner_team_id) REFERENCES teams(id),
  FOREIGN KEY (escalation_owner_user_id) REFERENCES users(id)
);

CREATE TABLE import_jobs (
  id CHAR(36) PRIMARY KEY,
  import_type VARCHAR(120) NOT NULL,
  uploaded_by_user_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  total_records INT NOT NULL DEFAULT 0,
  records_imported INT NOT NULL DEFAULT 0,
  records_failed INT NOT NULL DEFAULT 0,
  records_with_warnings INT NOT NULL DEFAULT 0,
  status ENUM('Draft','Validated','Imported','Failed','Cancelled') NOT NULL DEFAULT 'Draft',
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

CREATE TABLE import_job_rows (
  id CHAR(36) PRIMARY KEY,
  import_job_id CHAR(36) NOT NULL,
  row_number INT NOT NULL,
  source_payload JSON NULL,
  validation_status ENUM('Valid','Warning','Error') NOT NULL DEFAULT 'Valid',
  validation_messages JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_job_id) REFERENCES import_jobs(id)
);
```

## Governance

```sql
CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  action VARCHAR(160) NOT NULL,
  module VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id VARCHAR(120) NOT NULL,
  changed_by_user_id CHAR(36) NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  reason TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);
```

## Key Relationships

- User belongs to one role through `users.role_id`.
- User can belong to one or more teams through `user_teams`.
- Task can be assigned to and created by a user.
- Incident can be assigned to a user and has activity/comment history.
- Project has many project tasks; project task can be assigned to a user.
- Shift roster has many shift assignments.
- Handover has many handover points.
- SOP documents link to tasks, incidents, projects and handover points through `sop_links`.
- Import job has many import rows.
- Audit log references any module/entity through polymorphic `entity_type` and `entity_id`.
