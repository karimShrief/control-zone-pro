// Starter data for Ops Command Platform.
// Replace these bootstrap records with your own team data or wire the services to an API.

export type Role = "engineer" | "shift-lead" | "manager" | "executive" | "admin";

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
  team?: string;
  status?: "Active" | "Inactive";
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
  },
  {
    id: "u2",
    username: "shiftlead",
    password: "change-me",
    name: "Shift Lead User",
    role: "shift-lead",
    team: "Shared",
    status: "Active",
  },
  {
    id: "u3",
    username: "manager",
    password: "change-me",
    name: "Manager User",
    role: "manager",
    team: "Shared",
    status: "Active",
  },
  {
    id: "u4",
    username: "exec",
    password: "change-me",
    name: "Executive User",
    role: "executive",
    status: "Active",
  },
  {
    id: "u5",
    username: "admin",
    password: "change-me",
    name: "Admin User",
    role: "admin",
    team: "Shared",
    status: "Active",
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
}

export const tasks: Task[] = [];

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
  managerApproval: string;
}

export const shiftRequests: ShiftRequest[] = [];

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
  themePreference: "System",
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
