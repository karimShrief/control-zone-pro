// Starter data for Ops Command Platform.
// Replace these bootstrap records with your own team data or wire the services to an API.

export type Role = "engineer" | "shift-lead" | "manager" | "executive" | "admin";
export type AvailabilityStatus =
  "Available" | "External Activity" | "Emergency Leave" | "Off Duty" | "On Leave";

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
  team?: string;
  status?: "Active" | "Inactive";
  availability?: AvailabilityStatus;
  availabilityReason?: string;
  avatar?: string;
}

export const users: User[] = [
  {
    id: "u1",
    username: "engineer",
    password: "change-me",
    name: "Engineer User",
    role: "engineer",
    team: "DC",
    status: "Active",
    availability: "Available",
    availabilityReason: "Available for rotation",
  },
  {
    id: "u2",
    username: "shiftlead",
    password: "change-me",
    name: "Shift Lead User",
    role: "shift-lead",
    team: "Shared",
    status: "Active",
    availability: "External Activity",
    availabilityReason: "Training program outside the site",
  },
  {
    id: "u3",
    username: "manager",
    password: "change-me",
    name: "Manager User",
    role: "manager",
    team: "Shared",
    status: "Active",
    availability: "Available",
    availabilityReason: "Available for roster review",
  },
  {
    id: "u4",
    username: "exec",
    password: "change-me",
    name: "Executive User",
    role: "executive",
    status: "Active",
    availability: "Emergency Leave",
    availabilityReason: "Emergency leave approved",
  },
  {
    id: "u5",
    username: "admin",
    password: "change-me",
    name: "Admin User",
    role: "admin",
    team: "Shared",
    status: "Active",
    availability: "Available",
    availabilityReason: "Available for support coverage",
  },
  {
    id: "u6",
    username: "karim",
    password: "change-me",
    name: "Karim",
    role: "engineer",
    team: "DC",
    status: "Active",
    availability: "Available",
    availabilityReason: "Available for roster rotation",
  },
  {
    id: "u7",
    username: "ranko",
    password: "change-me",
    name: "Ranko",
    role: "engineer",
    team: "DC",
    status: "Active",
    availability: "Available",
    availabilityReason: "Available for roster rotation",
  },
  {
    id: "u8",
    username: "Fareed",
    password: "change-me",
    name: "Fareed",
    role: "engineer",
    team: "DC",
    status: "Active",
    availability: "Available",
    availabilityReason: "Available for roster rotation",
  },
  {
    id: "u9",
    username: "Shrief",
    password: "change-me",
    name: "Shrief",
    role: "engineer",
    team: "DC",
    status: "Active",
    availability: "Available",
    availabilityReason: "Available for roster rotation",
  },
  {
    id: "u10",
    username: "Febin",
    password: "change-me",
    name: "Febin",
    role: "engineer",
    team: "DC",
    status: "Active",
    availability: "Available",
    availabilityReason: "Available for roster rotation",
  },
  {
    id: "u11",
    username: "AbuTaher",
    password: "change-me",
    name: "AbuTaher",
    role: "engineer",
    team: "DC",
    status: "Active",
    availability: "Available",
    availabilityReason: "Available for roster rotation",
  },
];

export const engineers = users.filter((u) => u.role === "engineer");

export type TaskStatus =
  | "New"
  | "In Progress"
  | "Pending Team"
  | "Waiting Vendor"
  | "Waiting Network Team"
  | "Waiting Access"
  | "Waiting Approval"
  | "Escalated"
  | "Blocked"
  | "Completed"
  | "Cancelled";

export type Priority = "Low" | "Medium" | "High" | "Critical";
export type TaskType = "Daily DC Operation" | "General Task" | "NOC Task" | "DC Task";

export interface Task {
  id: string;
  title: string;
  description: string;
  details?: string;
  acceptanceCriteria?: string;
  type: TaskType;
  category: string;
  priority: Priority;
  impact: "Low" | "Medium" | "High";
  status: TaskStatus;
  assignee: string | null; // user id, null = unassigned, "shared" for shared daily ops
  dueDate: string;
  sla: "On Track" | "At Risk" | "Breached";
  comments: number;
  evidence: number;
  audit: "Pending" | "Approved" | "Needs Update";
  relatedIncident?: string | null;
  relatedProject?: string | null;
  relatedHandover?: string | null;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const tasks: Task[] = [
  {
    id: "TASK-1",
    title: "Daily DC equipment check",
    description: "Review the critical DC equipment checklist before the next shift.",
    details: "Inspect UPS, cooling, and generator readings. Confirm no alarms remain open.",
    acceptanceCriteria: "Checklist completed and signed off by the shift lead.",
    type: "Daily DC Operation",
    category: "DC Operations",
    priority: "High",
    impact: "High",
    status: "In Progress",
    assignee: "u6",
    dueDate: new Date().toISOString().slice(0, 10),
    sla: "On Track",
    comments: 0,
    evidence: 0,
    audit: "Pending",
    notes: "Complete before the next maintenance window.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export type IncidentSource =
  "Monitoring Alert" | "Manual" | "Handover" | "Project Issue" | "ITSM Ticket";
export type IncidentCategory =
  | "Network"
  | "Server"
  | "Storage"
  | "Power"
  | "Cooling"
  | "Security"
  | "Access"
  | "Application"
  | "Unknown";
export type Severity = "SEV-1" | "SEV-2" | "SEV-3" | "SEV-4";
export type IncidentStatus =
  "Unassigned" | "Assigned" | "Accepted" | "In Progress" | "Resolved" | "Closed";

export interface Incident {
  id: string;
  title: string;
  description: string;
  source: IncidentSource;
  sourceRef: string;
  category: IncidentCategory;
  subcategory: string;
  severity: Severity;
  status: IncidentStatus;
  assignee: string | null;
  sla: "On Track" | "At Risk" | "Breached";
  createdAt: string;
  updatedAt: string;
  resolution?: string;
  shift?: "Morning" | "Evening" | "Night";
  incidentAt?: string;
  impactDescription?: string;
  immediateActionTaken?: string;
  currentStatus?: string;
  relatedTask?: string | null;
  relatedHandover?: string | null;
  notes?: string;
}

export const incidents: Incident[] = [];

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignee: string | null;
  status: "To Do" | "In Progress" | "Review" | "Done" | "Blocked";
  priority: Priority;
  dueDate: string;
  dependency?: string;
  completion: number;
  comments: number;
  evidence: number;
  latestUpdate?: string;
  lastUpdatedBy?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: "Project" | "Initiative" | "Operational Improvement" | "Audit Action";
  owner: string;
  sponsor: string;
  team: string;
  priority: Priority;
  impact: "Low" | "Medium" | "High";
  status: "Planning" | "Active" | "On Hold" | "At Risk" | "Completed";
  startDate: string;
  targetDate: string;
  completion: number;
  risk: "Low" | "Medium" | "High";
  blockers: string[];
}

export const projects: Project[] = [];

export const projectTasks: ProjectTask[] = [];

export type ShiftType = "Morning" | "Evening" | "Night";
export type CoverageStatus = "Covered" | "Understaffed" | "Pending Update" | "Conflict";

export interface Shift {
  date: string;
  type: ShiftType;
  engineers: string[]; // user ids
  shiftLead?: string;
  coverageStatus?: CoverageStatus;
  notes?: string;
  status?: "Draft" | "Published";
  warnings?: string[];
}

const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);
function dayOffset(n: number) {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return fmt(d);
}

export const shifts: Shift[] = [];

export interface ShiftTypeConfig {
  id: string;
  name: ShiftType;
  startTime: string;
  endTime: string;
  minEngineers: number;
  enabled: boolean;
}

export interface CoverageRules {
  requireShiftLead: boolean;
  preventOverlappingAssignments: boolean;
  defaultMinimumEngineers: number;
}

export const shiftTypeConfigs: ShiftTypeConfig[] = [
  {
    id: "shift-type-morning",
    name: "Morning",
    startTime: "06:00",
    endTime: "14:00",
    minEngineers: 3,
    enabled: true,
  },
  {
    id: "shift-type-evening",
    name: "Evening",
    startTime: "14:00",
    endTime: "22:00",
    minEngineers: 3,
    enabled: true,
  },
  {
    id: "shift-type-night",
    name: "Night",
    startTime: "22:00",
    endTime: "06:00",
    minEngineers: 3,
    enabled: true,
  },
];

export const coverageRules: CoverageRules = {
  requireShiftLead: true,
  preventOverlappingAssignments: true,
  defaultMinimumEngineers: 3,
};

export interface ShiftRequest {
  id: string;
  type: "Shift Swap" | "Leave Early" | "Change Shift" | "Absence Note";
  requester: string;
  requestedDate: string;
  currentShift: ShiftType;
  requestedShift: ShiftType;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  shiftLeadApproval: string;
  managerApproval: string;
}

export const shiftRequests: ShiftRequest[] = [];

export type ImportType =
  | "Users"
  | "Tasks"
  | "Incidents"
  | "Projects"
  | "Project Tasks/Subtasks"
  | "Shift Roster"
  | "Shift Requests"
  | "Handover Points"
  | "SOP Metadata";

export type ImportJobStatus = "Draft" | "Validated" | "Imported" | "Failed" | "Cancelled";
export type ImportRowStatus = "Valid" | "Warning" | "Error";

export interface ImportTemplateField {
  name: string;
  required: boolean;
  example: string;
  notes?: string;
}

export interface ImportTemplateDefinition {
  type: ImportType;
  description: string;
  allowedRoles: Role[];
  fields: ImportTemplateField[];
  mysqlTargetTables: string[];
}

export interface ImportJob {
  id: string;
  importType: ImportType;
  uploadedBy: string;
  fileName: string;
  totalRecords: number;
  recordsImported: number;
  recordsFailed: number;
  recordsWithWarnings: number;
  status: ImportJobStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportJobRow {
  id: string;
  jobId: string;
  rowNumber: number;
  preview: Record<string, string>;
  validationStatus: ImportRowStatus;
  messages: string[];
}

export const importTemplateDefinitions: ImportTemplateDefinition[] = [
  {
    type: "Users",
    description: "Create or update platform users, roles and team assignment.",
    allowedRoles: ["admin"],
    mysqlTargetTables: ["users", "user_teams"],
    fields: [
      { name: "name", required: true, example: "First Last" },
      { name: "username", required: true, example: "first.last" },
      { name: "role", required: true, example: "engineer" },
      { name: "team", required: false, example: "DC" },
      { name: "status", required: false, example: "Active" },
    ],
  },
  {
    type: "Tasks",
    description: "Import Daily DC/NOC tasks and assigned operational activities.",
    allowedRoles: ["admin", "manager", "shift-lead"],
    mysqlTargetTables: ["tasks"],
    fields: [
      { name: "title", required: true, example: "Daily DC readiness check" },
      { name: "description", required: true, example: "Validate cooling and power dashboards" },
      { name: "type", required: true, example: "Daily DC Operation" },
      { name: "category", required: true, example: "DC Operations" },
      { name: "priority", required: true, example: "Medium" },
      { name: "impact", required: true, example: "Medium" },
      { name: "status", required: true, example: "New" },
      { name: "assignedEngineer", required: false, example: "engineer" },
      { name: "dueDate", required: true, example: "2026-08-15" },
      { name: "operationType", required: false, example: "Recurring" },
    ],
  },
  {
    type: "Incidents",
    description: "Import incidents from monitoring, handover or ITSM sources.",
    allowedRoles: ["admin", "manager", "shift-lead"],
    mysqlTargetTables: ["incidents", "incident_activity"],
    fields: [
      { name: "title", required: true, example: "Cooling alert in DC hall" },
      { name: "description", required: true, example: "Temperature threshold exceeded" },
      { name: "sourceType", required: true, example: "Monitoring Alert" },
      { name: "category", required: true, example: "Cooling" },
      { name: "subcategory", required: false, example: "CRAC alert" },
      { name: "severity", required: true, example: "SEV-2" },
      { name: "status", required: true, example: "Unassigned" },
      { name: "assignee", required: false, example: "shiftlead" },
      { name: "slaStatus", required: true, example: "On Track" },
      { name: "createdTime", required: true, example: "2026-08-15 09:30" },
    ],
  },
  {
    type: "Projects",
    description: "Import projects, initiatives and readiness actions.",
    allowedRoles: ["admin", "manager"],
    mysqlTargetTables: ["projects"],
    fields: [
      { name: "projectName", required: true, example: "NOC Monitoring Enhancement" },
      { name: "description", required: true, example: "Improve alert routing and dashboards" },
      { name: "owner", required: true, example: "manager" },
      { name: "sponsor", required: false, example: "exec" },
      { name: "team", required: true, example: "NOC" },
      { name: "priority", required: true, example: "High" },
      { name: "status", required: true, example: "Planning" },
      { name: "startDate", required: true, example: "2026-08-01" },
      { name: "targetDate", required: true, example: "2026-09-30" },
      { name: "riskLevel", required: true, example: "Medium" },
    ],
  },
  {
    type: "Project Tasks/Subtasks",
    description: "Import project subtasks, owners, dependencies and progress.",
    allowedRoles: ["admin", "manager"],
    mysqlTargetTables: ["project_tasks"],
    fields: [
      { name: "projectId", required: true, example: "PRJ-1" },
      { name: "title", required: true, example: "Collect monitoring requirements" },
      { name: "description", required: false, example: "Interview DC and NOC shift teams" },
      { name: "assignee", required: false, example: "engineer" },
      { name: "status", required: true, example: "To Do" },
      { name: "priority", required: true, example: "Medium" },
      { name: "dueDate", required: true, example: "2026-08-30" },
      { name: "dependency", required: false, example: "PRJ-TASK-1" },
      { name: "completion", required: false, example: "0" },
    ],
  },
  {
    type: "Shift Roster",
    description: "Import Morning, Evening and Night roster assignments.",
    allowedRoles: ["admin", "manager", "shift-lead"],
    mysqlTargetTables: ["shift_rosters", "shift_assignments"],
    fields: [
      { name: "date", required: true, example: "2026-08-15" },
      { name: "shiftType", required: true, example: "Morning" },
      { name: "assignedEngineers", required: true, example: "engineer; shiftlead" },
      { name: "shiftLead", required: false, example: "shiftlead" },
      { name: "coverageStatus", required: true, example: "Covered" },
      { name: "notes", required: false, example: "Monthly roster import" },
    ],
  },
  {
    type: "Shift Requests",
    description: "Import shift swap, leave early, change shift and absence requests.",
    allowedRoles: ["admin"],
    mysqlTargetTables: ["shift_requests"],
    fields: [
      { name: "requester", required: true, example: "engineer" },
      { name: "requestType", required: true, example: "Shift Swap" },
      { name: "requestedDate", required: true, example: "2026-08-15" },
      { name: "currentShift", required: true, example: "Morning" },
      { name: "requestedShift", required: true, example: "Night" },
      { name: "reason", required: true, example: "Coverage swap" },
      { name: "status", required: true, example: "Pending" },
    ],
  },
  {
    type: "Handover Points",
    description: "Import shift handover rows and pending follow-up points.",
    allowedRoles: ["admin", "manager", "shift-lead"],
    mysqlTargetTables: ["handovers", "handover_points"],
    fields: [
      { name: "date", required: true, example: "2026-08-15" },
      { name: "shiftType", required: true, example: "Night" },
      { name: "title", required: true, example: "Cooling alarm follow-up" },
      { name: "category", required: true, example: "Incident" },
      { name: "priority", required: true, example: "High" },
      { name: "relatedRef", required: false, example: "INC-1" },
      { name: "nextAction", required: true, example: "Manager review" },
      { name: "notes", required: true, example: "Waiting facilities update" },
    ],
  },
  {
    type: "SOP Metadata",
    description: "Import SOP document metadata, approval status and category tags.",
    allowedRoles: ["admin"],
    mysqlTargetTables: ["sop_documents", "sop_categories"],
    fields: [
      { name: "title", required: true, example: "Cooling Alert Runbook" },
      { name: "documentType", required: true, example: "Runbook" },
      { name: "category", required: true, example: "Cooling" },
      { name: "tags", required: false, example: "cooling; alert; facilities" },
      { name: "version", required: true, example: "1.0" },
      { name: "approvalStatus", required: true, example: "Approved" },
      { name: "lastUpdated", required: true, example: "2026-08-15" },
    ],
  },
];

export const importJobs: ImportJob[] = [];
export const importJobRows: ImportJobRow[] = [];

export type AdminModule =
  | "Dashboard"
  | "My Work"
  | "Tasks"
  | "Incidents"
  | "Projects"
  | "Shift Roster"
  | "Shift Requests"
  | "Handover"
  | "SOP Library"
  | "Import Center"
  | "Productivity"
  | "Reports"
  | "Admin";

export const moduleNames: AdminModule[] = [
  "Dashboard",
  "My Work",
  "Tasks",
  "Incidents",
  "Projects",
  "Shift Roster",
  "Shift Requests",
  "Handover",
  "SOP Library",
  "Import Center",
  "Productivity",
  "Reports",
  "Admin",
];

export interface RoleConfig {
  id: Role;
  label: string;
  description: string;
  enabled: boolean;
  modules: AdminModule[];
  permissions: string[];
}

export const roleConfigs: RoleConfig[] = [
  {
    id: "engineer",
    label: "Engineer",
    description: "Own work, shared daily DC operations, own schedule and shift requests.",
    enabled: true,
    modules: [
      "My Work",
      "Tasks",
      "Incidents",
      "Projects",
      "Shift Roster",
      "Shift Requests",
      "Handover",
      "SOP Library",
    ],
    permissions: [
      "View own work",
      "Update assigned work",
      "Submit handover",
      "Submit shift requests",
    ],
  },
  {
    id: "shift-lead",
    label: "Shift Lead",
    description: "Front-line shift coordination role, available for future assignment.",
    enabled: false,
    modules: [
      "My Work",
      "Tasks",
      "Incidents",
      "Projects",
      "Shift Roster",
      "Shift Requests",
      "Handover",
      "SOP Library",
      "Import Center",
      "Reports",
    ],
    permissions: ["View team work", "Coordinate shift", "Submit handover"],
  },
  {
    id: "manager",
    label: "Manager",
    description: "Full operational visibility, roster review, shift approvals and audit.",
    enabled: true,
    modules: [
      "Dashboard",
      "Tasks",
      "Incidents",
      "Projects",
      "Shift Roster",
      "Shift Requests",
      "Handover",
      "SOP Library",
      "Import Center",
      "Productivity",
      "Reports",
    ],
    permissions: ["View all operations", "Assign work", "Approve shift requests", "Audit handover"],
  },
  {
    id: "executive",
    label: "Executive",
    description: "Read-only command summary and high-level operational reporting.",
    enabled: true,
    modules: [
      "Dashboard",
      "Incidents",
      "Projects",
      "Shift Roster",
      "SOP Library",
      "Import Center",
      "Productivity",
      "Reports",
    ],
    permissions: ["Read-only dashboards", "Read-only reports", "Read-only coverage summary"],
  },
  {
    id: "admin",
    label: "Admin",
    description: "Full configuration control for users, roles, teams, roster and system settings.",
    enabled: true,
    modules: moduleNames,
    permissions: ["Manage users", "Manage configuration", "Manage roster", "View audit log"],
  },
];

export interface TeamConfig {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export const teamConfigs: TeamConfig[] = [
  {
    id: "DC",
    name: "DC Team",
    description: "Data Center operations and facilities coverage.",
    active: true,
  },
  {
    id: "NOC",
    name: "NOC Team",
    description: "Network monitoring, alerts and service continuity.",
    active: true,
  },
  {
    id: "Shared",
    name: "Shared Operations",
    description: "Cross-functional command and escalation coverage.",
    active: true,
  },
];

export type CategoryModule =
  "Tasks" | "Incidents" | "Projects" | "SOP documents" | "Handover points";

export interface CategoryConfig {
  id: string;
  module: CategoryModule;
  name: string;
  active: boolean;
}

export const categoryConfigs: CategoryConfig[] = [
  { id: "cat-task-dc", module: "Tasks", name: "DC Operations", active: true },
  { id: "cat-task-power", module: "Tasks", name: "Power", active: true },
  { id: "cat-task-network", module: "Tasks", name: "Network", active: true },
  { id: "cat-incident-cooling", module: "Incidents", name: "Cooling", active: true },
  { id: "cat-incident-security", module: "Incidents", name: "Security", active: true },
  { id: "cat-project-audit", module: "Projects", name: "Audit Action", active: true },
  { id: "cat-sop-runbook", module: "SOP documents", name: "Runbook", active: true },
  { id: "cat-handover-alert", module: "Handover points", name: "Alert", active: true },
];

export type StatusModule =
  "Tasks" | "Incidents" | "Projects" | "Shift requests" | "Handover points";

export interface StatusConfig {
  id: string;
  module: StatusModule;
  name: string;
  tone: "success" | "warning" | "critical" | "info" | "neutral";
  active: boolean;
}

export const statusConfigs: StatusConfig[] = [
  { id: "status-task-new", module: "Tasks", name: "New", tone: "neutral", active: true },
  { id: "status-task-progress", module: "Tasks", name: "In Progress", tone: "info", active: true },
  {
    id: "status-task-completed",
    module: "Tasks",
    name: "Completed",
    tone: "success",
    active: true,
  },
  {
    id: "status-incident-assigned",
    module: "Incidents",
    name: "Assigned",
    tone: "info",
    active: true,
  },
  {
    id: "status-incident-resolved",
    module: "Incidents",
    name: "Resolved",
    tone: "success",
    active: true,
  },
  { id: "status-project-risk", module: "Projects", name: "At Risk", tone: "warning", active: true },
  {
    id: "status-shift-pending",
    module: "Shift requests",
    name: "Pending",
    tone: "warning",
    active: true,
  },
  {
    id: "status-shift-approved",
    module: "Shift requests",
    name: "Approved",
    tone: "success",
    active: true,
  },
  {
    id: "status-handover-open",
    module: "Handover points",
    name: "Open",
    tone: "neutral",
    active: true,
  },
];

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  recurrence: "Daily" | "Weekly" | "Monthly" | "On Demand";
  ownerTeam: string;
  checklist: string[];
  evidenceRequired: boolean;
  sharedDailyOperation: boolean;
  active: boolean;
}

export const taskTemplates: TaskTemplate[] = [
  {
    id: "task-template-daily-dc",
    name: "Daily DC Operations Readiness",
    description: "Generates the standard daily operations checks for data center shift engineers.",
    type: "Daily DC Operation",
    recurrence: "Daily",
    ownerTeam: "DC",
    checklist: [
      "Review power and cooling dashboard",
      "Check access log exceptions",
      "Confirm backup and monitoring alerts",
    ],
    evidenceRequired: true,
    sharedDailyOperation: true,
    active: true,
  },
];

export interface IncidentRule {
  id: string;
  category: IncidentCategory;
  defaultSeverity: Severity;
  slaMinutes: number;
  assignmentTeam: string;
  recommendedSop: string;
  escalationPath: string;
  active: boolean;
}

export const incidentRules: IncidentRule[] = [
  {
    id: "incident-rule-cooling",
    category: "Cooling",
    defaultSeverity: "SEV-2",
    slaMinutes: 30,
    assignmentTeam: "DC",
    recommendedSop: "Cooling Alert Response Runbook",
    escalationPath: "Shift Lead -> Facilities Duty Manager",
    active: true,
  },
  {
    id: "incident-rule-network",
    category: "Network",
    defaultSeverity: "SEV-2",
    slaMinutes: 45,
    assignmentTeam: "NOC",
    recommendedSop: "Network Service Degradation Runbook",
    escalationPath: "NOC Lead -> Network Duty Manager",
    active: true,
  },
];

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  defaultTeam: string;
  phases: string[];
  governanceGate: string;
  active: boolean;
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: "project-template-audit-remediation",
    name: "Audit Remediation Action Plan",
    description: "Creates standard phases for audit findings, remediation, validation and closure.",
    defaultTeam: "Shared",
    phases: ["Assess finding", "Assign remediation owner", "Collect evidence", "Management review"],
    governanceGate: "Evidence must be approved before closure",
    active: true,
  },
];

export interface RosterRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  mandatoryEngineer?: string;
  mandatoryShift: ShiftType | "Any";
  fairnessTarget: string;
  active: boolean;
}

export const rosterRules: RosterRule[] = [
  {
    id: "roster-rule-core-coverage",
    name: "Core 24x7 Coverage",
    description: "Keeps all three shifts staffed and flags conflicts before roster publishing.",
    pattern: "Morning / Evening / Night rotation with weekly review",
    mandatoryShift: "Any",
    fairnessTarget: "Balance night shifts and weekends across active engineers",
    active: true,
  },
];

export interface HandoverTemplate {
  id: string;
  name: string;
  description: string;
  requiredCategories: HandoverCategory[];
  requiresAcknowledgement: boolean;
  criticalRequiresNextAction: boolean;
  active: boolean;
}

export const handoverTemplates: HandoverTemplate[] = [
  {
    id: "handover-template-shift-close",
    name: "Shift Close Handover",
    description: "Standard handover categories for DC/NOC shift closure and continuity.",
    requiredCategories: ["Incident", "Task", "Alert", "General"],
    requiresAcknowledgement: true,
    criticalRequiresNextAction: true,
    active: true,
  },
];

export interface SopSetting {
  id: string;
  name: string;
  category: string;
  approvalWorkflow: string;
  visibilityRule: string;
  linkableTo: AdminModule[];
  active: boolean;
}

export const sopSettings: SopSetting[] = [
  {
    id: "sop-setting-runbooks",
    name: "Operational Runbooks",
    category: "Runbook",
    approvalWorkflow: "Author -> Shift Lead Review -> Manager Approval",
    visibilityRule: "Visible to operations roles after approval",
    linkableTo: ["Tasks", "Incidents", "Projects", "Handover"],
    active: true,
  },
];

export interface DashboardWidgetSetting {
  id: string;
  role: Role;
  widget: string;
  description: string;
  enabled: boolean;
  governanceSignal: string;
}

export const dashboardWidgetSettings: DashboardWidgetSetting[] = [
  {
    id: "widget-manager-command-health",
    role: "manager",
    widget: "Operations Health",
    description: "Shows open work, SLA risk, critical incidents and shift coverage.",
    enabled: true,
    governanceSignal: "Role Restricted",
  },
  {
    id: "widget-exec-monthly-trend",
    role: "executive",
    widget: "Monthly Trend",
    description: "Read-only view of SLA compliance, incident trend and project progress.",
    enabled: true,
    governanceSignal: "Read Only",
  },
];

export interface SlaEscalationPolicy {
  id: string;
  name: string;
  appliesTo: "Tasks" | "Incidents" | "Projects" | "Handover";
  thresholdMinutes: number;
  escalationOwner: string;
  active: boolean;
}

export const slaEscalationPolicies: SlaEscalationPolicy[] = [
  {
    id: "sla-policy-critical-incident",
    name: "Critical Incident Escalation",
    appliesTo: "Incidents",
    thresholdMinutes: 30,
    escalationOwner: "Shared",
    active: true,
  },
];

export interface SystemSettings {
  appName: string;
  logoPlaceholder: string;
  themePreference: "System" | "Light" | "Dark";
  enabledModules: AdminModule[];
  navigationVisibility: Partial<Record<Role, AdminModule[]>>;
}

export const systemSettings: SystemSettings = {
  appName: "Ops Command Platform",
  logoPlaceholder: "OCP",
  themePreference: "Light",
  enabledModules: moduleNames,
  navigationVisibility: {
    engineer: roleConfigs.find((role) => role.id === "engineer")?.modules ?? [],
    manager: roleConfigs.find((role) => role.id === "manager")?.modules ?? [],
    executive: roleConfigs.find((role) => role.id === "executive")?.modules ?? [],
    admin: roleConfigs.find((role) => role.id === "admin")?.modules ?? [],
  },
};

export type HandoverCategory =
  "Incident" | "Task" | "Project" | "Maintenance" | "Alert" | "Access" | "General";

export interface HandoverComment {
  id: string;
  handoverId: string;
  handoverPointId?: string;
  commentText: string;
  createdBy: string;
  createdAt: string;
  role: Role;
  visibility?: "Team" | "Manager Only" | "Admin Only";
}

export interface HandoverPoint {
  id: string;
  date: string;
  shift: ShiftType;
  title: string;
  category: HandoverCategory;
  priority: Priority;
  status: "Open" | "Monitoring" | "Resolved";
  owner: string;
  relatedRef?: string;
  nextAction: string;
  notes: string;
  evidence: number;
  acknowledged: boolean;
  audit: "Pending" | "Approved" | "Needs Update";
}

export const handoverPoints: HandoverPoint[] = [];
export const handoverComments: HandoverComment[] = [];

export interface SOP {
  id: string;
  title: string;
  description: string;
  category: string;
  type:
    | "SOP"
    | "Runbook"
    | "Troubleshooting Guide"
    | "Maintenance Procedure"
    | "Emergency Procedure"
    | "Project Document"
    | "Audit Document";
  tags: string[];
  version: string;
  createdBy: string;
  lastUpdated: string;
  approval: "Approved" | "In Review" | "Draft";
}

export const sops: SOP[] = [];

export const productivity: Array<{ name: string; completed: number; open: number; sla: number }> =
  [];

export const monthlyTrend: Array<{
  month: string;
  incidents: number;
  resolved: number;
  sla: number;
}> = [];

export function userById(id: string | null | undefined): string {
  if (!id) return "Unassigned";
  if (id === "shared") return "Shared (All Engineers)";
  return users.find((u) => u.id === id)?.name ?? "Unknown";
}
