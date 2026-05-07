// Mock data for Ops Command Platform

export type Role = "engineer" | "manager" | "executive" | "admin";

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
  team?: "DC" | "NOC" | "Shared";
  avatar?: string;
}

export const users: User[] = [
  { id: "u1", username: "ahmed", password: "demo", name: "Ahmed Al Marzouqi", role: "engineer", team: "DC" },
  { id: "u2", username: "khalid", password: "demo", name: "Khalid Al Hammadi", role: "engineer", team: "NOC" },
  { id: "u3", username: "saeed", password: "demo", name: "Saeed Al Mansouri", role: "engineer", team: "DC" },
  { id: "u4", username: "omar", password: "demo", name: "Omar Al Shamsi", role: "engineer", team: "NOC" },
  { id: "u5", username: "hassan", password: "demo", name: "Hassan Al Zaabi", role: "engineer", team: "DC" },
  { id: "u6", username: "yousef", password: "demo", name: "Yousef Al Nuaimi", role: "engineer", team: "NOC" },
  { id: "u7", username: "manager", password: "demo", name: "Mohammed Al Suwaidi", role: "manager", team: "Shared" },
  { id: "u8", username: "exec", password: "demo", name: "Dr. Fatima Al Hashimi", role: "executive" },
  { id: "u9", username: "admin", password: "demo", name: "System Administrator", role: "admin" },
];

export const engineers = users.filter((u) => u.role === "engineer");

export type TaskStatus =
  | "New" | "In Progress" | "Pending Team" | "Waiting Vendor"
  | "Waiting Network Team" | "Waiting Access" | "Waiting Approval"
  | "Escalated" | "Blocked" | "Completed" | "Cancelled";

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

export const tasks: Task[] = [
  { id: "T-1001", title: "DC Walkthrough — Hall A inspection", description: "Verify all racks, cooling, and visual checks in Hall A", type: "Daily DC Operation", category: "DC Operations", priority: "Medium", impact: "Medium", status: "In Progress", assignee: "shared", dueDate: "2026-05-07", sla: "On Track", comments: 3, evidence: 2, audit: "Pending" },
  { id: "T-1002", title: "UPS Battery Health Check", description: "Daily UPS battery monitoring and log capture", type: "Daily DC Operation", category: "Power", priority: "High", impact: "High", status: "New", assignee: "shared", dueDate: "2026-05-07", sla: "On Track", comments: 0, evidence: 0, audit: "Pending" },
  { id: "T-1003", title: "Cooling temperature log — CRAC units", description: "Capture temperature readings from CRAC units 1–6", type: "Daily DC Operation", category: "Cooling", priority: "Medium", impact: "Medium", status: "Completed", assignee: "shared", dueDate: "2026-05-07", sla: "On Track", comments: 1, evidence: 4, audit: "Approved" },
  { id: "T-1004", title: "Patch core switch SW-CORE-02", description: "Apply firmware patch during change window", type: "NOC Task", category: "Network", priority: "High", impact: "High", status: "Waiting Approval", assignee: "u2", dueDate: "2026-05-09", sla: "At Risk", comments: 5, evidence: 1, audit: "Pending" },
  { id: "T-1005", title: "Replace faulty PDU in Rack R-12", description: "Coordinate with vendor for PDU replacement", type: "DC Task", category: "Power", priority: "Critical", impact: "High", status: "Waiting Vendor", assignee: "u1", dueDate: "2026-05-08", sla: "Breached", comments: 8, evidence: 3, audit: "Needs Update" },
  { id: "T-1006", title: "Review NOC monitoring thresholds", description: "Adjust thresholds for false-positive reduction", type: "NOC Task", category: "Monitoring", priority: "Low", impact: "Low", status: "In Progress", assignee: "u4", dueDate: "2026-05-12", sla: "On Track", comments: 2, evidence: 0, audit: "Pending" },
  { id: "T-1007", title: "Access list audit — server room B", description: "Quarterly access audit per ISO 27001", type: "General Task", category: "Access", priority: "Medium", impact: "Medium", status: "New", assignee: null, dueDate: "2026-05-15", sla: "On Track", comments: 0, evidence: 0, audit: "Pending" },
  { id: "T-1008", title: "Backup verification — primary storage", description: "Verify weekly backup integrity", type: "DC Task", category: "Storage", priority: "High", impact: "High", status: "Completed", assignee: "u3", dueDate: "2026-05-06", sla: "On Track", comments: 4, evidence: 5, audit: "Approved" },
  { id: "T-1009", title: "Investigate intermittent latency — link MPLS-1", description: "Investigate spikes reported overnight", type: "NOC Task", category: "Network", priority: "High", impact: "High", status: "Escalated", assignee: "u6", dueDate: "2026-05-07", sla: "At Risk", comments: 6, evidence: 2, audit: "Pending" },
  { id: "T-1010", title: "Update DC visitor log system", description: "Migrate to new visitor log application", type: "General Task", category: "Access", priority: "Low", impact: "Low", status: "Pending Team", assignee: "u5", dueDate: "2026-05-20", sla: "On Track", comments: 1, evidence: 0, audit: "Pending" },
  { id: "T-1011", title: "Fire suppression quarterly check", description: "Coordinate with safety vendor", type: "DC Task", category: "Safety", priority: "Medium", impact: "Medium", status: "Waiting Vendor", assignee: "u3", dueDate: "2026-05-14", sla: "On Track", comments: 2, evidence: 0, audit: "Pending" },
  { id: "T-1012", title: "Generator load test", description: "Monthly generator load test", type: "DC Task", category: "Power", priority: "High", impact: "High", status: "New", assignee: null, dueDate: "2026-05-18", sla: "On Track", comments: 0, evidence: 0, audit: "Pending" },
];

export type IncidentSource = "Monitoring Alert" | "Manual" | "Handover" | "Project Issue" | "ITSM Ticket Mock";
export type IncidentCategory = "Network" | "Server" | "Storage" | "Power" | "Cooling" | "Security" | "Access" | "Application" | "Unknown";
export type Severity = "SEV-1" | "SEV-2" | "SEV-3" | "SEV-4";
export type IncidentStatus = "Unassigned" | "Assigned" | "Accepted" | "In Progress" | "Resolved" | "Closed";

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

export const incidents: Incident[] = [
  { id: "INC-2041", title: "Core switch SW-CORE-01 high CPU", description: "CPU > 95% for 10 minutes", source: "Monitoring Alert", sourceRef: "PRTG-8821", category: "Network", subcategory: "Switching", severity: "SEV-2", status: "In Progress", assignee: "u2", sla: "At Risk", createdAt: "2026-05-07 06:12", updatedAt: "2026-05-07 07:01" },
  { id: "INC-2042", title: "CRAC Unit 4 fan failure alarm", description: "Fan 2 stopped, redundancy active", source: "Monitoring Alert", sourceRef: "BMS-441", category: "Cooling", subcategory: "CRAC", severity: "SEV-2", status: "Assigned", assignee: "u1", sla: "On Track", createdAt: "2026-05-07 05:48", updatedAt: "2026-05-07 06:30" },
  { id: "INC-2043", title: "Unauthorized access attempt — Hall B door", description: "Badge denied 5x in 2 minutes", source: "Monitoring Alert", sourceRef: "SEC-1102", category: "Security", subcategory: "Physical Access", severity: "SEV-1", status: "Accepted", assignee: "u3", sla: "On Track", createdAt: "2026-05-07 02:14", updatedAt: "2026-05-07 02:35" },
  { id: "INC-2044", title: "Application portal slowness reported", description: "Users report slow load times", source: "ITSM Ticket Mock", sourceRef: "SVC-77124", category: "Application", subcategory: "Performance", severity: "SEV-3", status: "Unassigned", assignee: null, sla: "On Track", createdAt: "2026-05-07 08:20", updatedAt: "2026-05-07 08:20" },
  { id: "INC-2045", title: "Storage array degraded — disk failure", description: "Disk 4 in array SA-02 failed, hot spare engaged", source: "Monitoring Alert", sourceRef: "SAN-204", category: "Storage", subcategory: "Disk", severity: "SEV-2", status: "In Progress", assignee: "u5", sla: "On Track", createdAt: "2026-05-06 22:11", updatedAt: "2026-05-07 04:00" },
  { id: "INC-2046", title: "Power feed B voltage fluctuation", description: "Reported during shift handover", source: "Handover", sourceRef: "HO-2026-05-07-N", category: "Power", subcategory: "Distribution", severity: "SEV-2", status: "Unassigned", assignee: null, sla: "At Risk", createdAt: "2026-05-07 06:00", updatedAt: "2026-05-07 06:00" },
  { id: "INC-2047", title: "Backup job failure — DB cluster", description: "Nightly backup did not complete", source: "Monitoring Alert", sourceRef: "BKP-991", category: "Server", subcategory: "Backup", severity: "SEV-3", status: "Resolved", assignee: "u4", sla: "On Track", createdAt: "2026-05-06 03:00", updatedAt: "2026-05-06 09:14", resolution: "Restarted backup agent, job completed successfully." },
  { id: "INC-2048", title: "VPN gateway packet loss", description: "Remote users experiencing drops", source: "Manual", sourceRef: "Reported by NOC", category: "Network", subcategory: "VPN", severity: "SEV-3", status: "Closed", assignee: "u6", sla: "On Track", createdAt: "2026-05-05 14:00", updatedAt: "2026-05-05 18:22", resolution: "ISP confirmed transient issue." },
];

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
  team: "DC" | "NOC" | "Shared";
  priority: Priority;
  impact: "Low" | "Medium" | "High";
  status: "Planning" | "Active" | "On Hold" | "At Risk" | "Completed";
  startDate: string;
  targetDate: string;
  completion: number;
  risk: "Low" | "Medium" | "High";
  blockers: string[];
}

export const projects: Project[] = [
  { id: "P-301", name: "DC Cooling Modernization Phase 2", description: "Upgrade CRAC units 4–8 with new variable-speed compressors", type: "Project", owner: "u1", sponsor: "u7", team: "DC", priority: "High", impact: "High", status: "Active", startDate: "2026-03-01", targetDate: "2026-08-30", completion: 42, risk: "Medium", blockers: ["Vendor lead time"] },
  { id: "P-302", name: "Network Segmentation — Zero Trust Rollout", description: "Implement micro-segmentation across DC fabric", type: "Project", owner: "u2", sponsor: "u7", team: "NOC", priority: "Critical", impact: "High", status: "At Risk", startDate: "2026-02-10", targetDate: "2026-07-15", completion: 28, risk: "High", blockers: ["Pending change approval", "Vendor support"] },
  { id: "P-303", name: "Monitoring Platform Consolidation", description: "Migrate from 3 tools to unified observability stack", type: "Initiative", owner: "u4", sponsor: "u7", team: "NOC", priority: "Medium", impact: "Medium", status: "Active", startDate: "2026-01-20", targetDate: "2026-09-30", completion: 55, risk: "Low", blockers: [] },
  { id: "P-304", name: "ISO 27001 Audit Remediation", description: "Address findings from external audit", type: "Audit Action", owner: "u3", sponsor: "u7", team: "Shared", priority: "High", impact: "High", status: "Active", startDate: "2026-04-01", targetDate: "2026-06-30", completion: 65, risk: "Medium", blockers: [] },
  { id: "P-305", name: "DC Visitor Log Modernization", description: "Replace paper visitor log with digital workflow", type: "Operational Improvement", owner: "u5", sponsor: "u7", team: "DC", priority: "Low", impact: "Low", status: "Planning", startDate: "2026-05-15", targetDate: "2026-10-01", completion: 5, risk: "Low", blockers: [] },
];

export const projectTasks: ProjectTask[] = [
  { id: "PT-1", projectId: "P-301", title: "Site survey — CRAC 4", description: "Pre-installation survey", assignee: "u1", status: "Done", priority: "High", dueDate: "2026-04-01", completion: 100, comments: 3, evidence: 2 },
  { id: "PT-2", projectId: "P-301", title: "Procure compressors", description: "Vendor PO and shipping", assignee: "u1", status: "In Progress", priority: "High", dueDate: "2026-05-30", completion: 60, comments: 2, evidence: 1, dependency: "PT-1" },
  { id: "PT-3", projectId: "P-301", title: "Schedule install window", description: "Coordinate with operations", assignee: "u3", status: "To Do", priority: "Medium", dueDate: "2026-06-10", completion: 0, comments: 0, evidence: 0 },
  { id: "PT-4", projectId: "P-302", title: "Design segmentation policy", description: "Define zones and rules", assignee: "u2", status: "Review", priority: "Critical", dueDate: "2026-05-15", completion: 80, comments: 5, evidence: 1 },
  { id: "PT-5", projectId: "P-302", title: "Pilot rollout — Hall A", description: "Pilot on non-critical hall", assignee: "u6", status: "Blocked", priority: "High", dueDate: "2026-05-25", completion: 20, comments: 3, evidence: 0, dependency: "PT-4" },
  { id: "PT-6", projectId: "P-303", title: "Vendor evaluation", description: "Compare top 3 vendors", assignee: "u4", status: "Done", priority: "Medium", dueDate: "2026-03-01", completion: 100, comments: 4, evidence: 3 },
  { id: "PT-7", projectId: "P-303", title: "POC deployment", description: "Deploy in lab", assignee: "u4", status: "In Progress", priority: "Medium", dueDate: "2026-06-15", completion: 50, comments: 2, evidence: 1 },
  { id: "PT-8", projectId: "P-304", title: "Update access control SOP", description: "Revise SOP-008", assignee: "u3", status: "Done", priority: "High", dueDate: "2026-04-20", completion: 100, comments: 1, evidence: 2 },
  { id: "PT-9", projectId: "P-304", title: "Conduct access audit", description: "Quarterly access review", assignee: "u3", status: "In Progress", priority: "High", dueDate: "2026-05-30", completion: 40, comments: 2, evidence: 1 },
];

export interface Shift {
  date: string;
  type: "Morning" | "Night";
  engineers: string[]; // user ids
}

const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);
function dayOffset(n: number) { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); }

export const shifts: Shift[] = [
  { date: dayOffset(-1), type: "Morning", engineers: ["u1", "u3", "u5"] },
  { date: dayOffset(-1), type: "Night", engineers: ["u2", "u4", "u6"] },
  { date: dayOffset(0), type: "Morning", engineers: ["u1", "u3", "u5"] },
  { date: dayOffset(0), type: "Night", engineers: ["u2", "u4", "u6"] },
  { date: dayOffset(1), type: "Morning", engineers: ["u2", "u4", "u6"] },
  { date: dayOffset(1), type: "Night", engineers: ["u1", "u3", "u5"] },
  { date: dayOffset(2), type: "Morning", engineers: ["u2", "u4", "u6"] },
  { date: dayOffset(2), type: "Night", engineers: ["u1", "u3", "u5"] },
  { date: dayOffset(3), type: "Morning", engineers: ["u1", "u4", "u5"] },
  { date: dayOffset(3), type: "Night", engineers: ["u2", "u3", "u6"] },
];

export interface ShiftRequest {
  id: string;
  type: "Shift Swap" | "Leave Early" | "Change Shift" | "Absence Note";
  requester: string;
  requestedDate: string;
  currentShift: "Morning" | "Night";
  requestedShift: "Morning" | "Night";
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  managerApproval: string;
}

export const shiftRequests: ShiftRequest[] = [
  { id: "SR-1", type: "Shift Swap", requester: "u3", requestedDate: dayOffset(2), currentShift: "Morning", requestedShift: "Night", reason: "Family appointment", status: "Pending", managerApproval: "—" },
  { id: "SR-2", type: "Leave Early", requester: "u4", requestedDate: dayOffset(0), currentShift: "Night", requestedShift: "Night", reason: "Medical", status: "Approved", managerApproval: "Approved by manager" },
  { id: "SR-3", type: "Absence Note", requester: "u6", requestedDate: dayOffset(1), currentShift: "Morning", requestedShift: "Morning", reason: "Sick leave", status: "Pending", managerApproval: "—" },
];

export type HandoverCategory = "Incident" | "Task" | "Project" | "Maintenance" | "Alert" | "Access" | "General";

export interface HandoverPoint {
  id: string;
  date: string;
  shift: "Morning" | "Night";
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

export const handoverPoints: HandoverPoint[] = [
  { id: "HP-1", date: dayOffset(0), shift: "Morning", title: "INC-2041 still investigating SW-CORE-01 CPU", category: "Incident", priority: "High", status: "Monitoring", owner: "u2", relatedRef: "INC-2041", nextAction: "Continue packet capture, escalate to vendor if not resolved by 12:00", notes: "CPU dropped to 70% after disabling debug logging.", evidence: 1, acknowledged: true, audit: "Pending" },
  { id: "HP-2", date: dayOffset(0), shift: "Morning", title: "CRAC-4 fan failure — vendor ETA 14:00", category: "Maintenance", priority: "High", status: "Open", owner: "u1", relatedRef: "INC-2042", nextAction: "Receive vendor, supervise replacement", notes: "Redundancy active, temp stable.", evidence: 2, acknowledged: true, audit: "Approved" },
  { id: "HP-3", date: dayOffset(0), shift: "Morning", title: "Power feed B fluctuation observed overnight", category: "Alert", priority: "High", status: "Open", owner: "u5", relatedRef: "INC-2046", nextAction: "Engage electrical team for measurement", notes: "Noted at 03:14 and 04:50.", evidence: 0, acknowledged: false, audit: "Pending" },
  { id: "HP-4", date: dayOffset(-1), shift: "Night", title: "Backup verification completed", category: "Task", priority: "Medium", status: "Resolved", owner: "u4", relatedRef: "T-1008", nextAction: "None", notes: "All backups verified.", evidence: 1, acknowledged: true, audit: "Approved" },
  { id: "HP-5", date: dayOffset(-1), shift: "Night", title: "Access door Hall B — pending vendor inspection", category: "Access", priority: "Medium", status: "Open", owner: "u3", nextAction: "Coordinate vendor visit", notes: "Lock mechanism stiff.", evidence: 0, acknowledged: true, audit: "Needs Update" },
];

export interface SOP {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "SOP" | "Runbook" | "Troubleshooting Guide" | "Maintenance Procedure" | "Emergency Procedure" | "Project Document" | "Audit Document";
  tags: string[];
  version: string;
  createdBy: string;
  lastUpdated: string;
  approval: "Approved" | "In Review" | "Draft";
}

export const sops: SOP[] = [
  { id: "SOP-001", title: "DC Daily Walkthrough Procedure", description: "Standard procedure for daily DC walkthroughs", category: "DC Operations", type: "SOP", tags: ["walkthrough", "daily"], version: "2.3", createdBy: "u1", lastUpdated: "2026-04-12", approval: "Approved" },
  { id: "SOP-002", title: "CRAC Unit Failure Response", description: "Runbook for CRAC failure incidents", category: "Cooling", type: "Runbook", tags: ["cooling", "incident"], version: "1.5", createdBy: "u3", lastUpdated: "2026-03-22", approval: "Approved" },
  { id: "SOP-003", title: "Network Switch Patching", description: "Steps for safe switch firmware patching", category: "Network", type: "Maintenance Procedure", tags: ["network", "patching"], version: "3.1", createdBy: "u2", lastUpdated: "2026-04-30", approval: "Approved" },
  { id: "SOP-004", title: "Power Outage Emergency Procedure", description: "Emergency response for full power loss", category: "Power", type: "Emergency Procedure", tags: ["power", "emergency"], version: "4.0", createdBy: "u1", lastUpdated: "2026-02-10", approval: "Approved" },
  { id: "SOP-005", title: "Storage Disk Failure Troubleshooting", description: "Triage and replacement guide", category: "Storage", type: "Troubleshooting Guide", tags: ["storage", "san"], version: "1.2", createdBy: "u5", lastUpdated: "2026-04-05", approval: "In Review" },
  { id: "SOP-006", title: "Access Control Audit Procedure", description: "ISO 27001 aligned access audit", category: "Access", type: "Audit Document", tags: ["audit", "iso"], version: "2.0", createdBy: "u3", lastUpdated: "2026-04-25", approval: "Approved" },
  { id: "SOP-007", title: "Shift Handover Standard", description: "Standardized handover protocol", category: "Operations", type: "SOP", tags: ["shift", "handover"], version: "1.4", createdBy: "u7", lastUpdated: "2026-04-01", approval: "Approved" },
  { id: "SOP-008", title: "Monitoring Alert Triage", description: "How to triage incoming monitoring alerts", category: "Monitoring", type: "Runbook", tags: ["noc", "alerts"], version: "2.1", createdBy: "u4", lastUpdated: "2026-04-18", approval: "Approved" },
  { id: "SOP-009", title: "Vendor Escort Procedure", description: "Physical access for vendors", category: "Access", type: "SOP", tags: ["access", "vendor"], version: "1.0", createdBy: "u3", lastUpdated: "2026-03-15", approval: "Draft" },
];

export const productivity = [
  { name: "Ahmed", completed: 18, open: 4, sla: 96 },
  { name: "Khalid", completed: 22, open: 3, sla: 92 },
  { name: "Saeed", completed: 15, open: 6, sla: 88 },
  { name: "Omar", completed: 19, open: 2, sla: 98 },
  { name: "Hassan", completed: 14, open: 5, sla: 90 },
  { name: "Yousef", completed: 17, open: 3, sla: 94 },
];

export const monthlyTrend = [
  { month: "Dec", incidents: 42, resolved: 40, sla: 94 },
  { month: "Jan", incidents: 38, resolved: 37, sla: 95 },
  { month: "Feb", incidents: 51, resolved: 48, sla: 92 },
  { month: "Mar", incidents: 47, resolved: 46, sla: 96 },
  { month: "Apr", incidents: 39, resolved: 38, sla: 97 },
  { month: "May", incidents: 33, resolved: 30, sla: 95 },
];

export function userById(id: string | null | undefined): string {
  if (!id) return "Unassigned";
  if (id === "shared") return "Shared (All Engineers)";
  return users.find((u) => u.id === id)?.name ?? "Unknown";
}
