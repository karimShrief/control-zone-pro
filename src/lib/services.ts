import {
  handoverPoints,
  incidents,
  projectTasks,
  projects,
  shiftRequests,
  shifts,
  sops,
  tasks,
  users,
  type HandoverPoint,
  type Incident,
  type IncidentStatus,
  type ProjectTask,
  type ShiftRequest,
  type TaskStatus,
} from "./mock-data";
import { recordAuditLog } from "./audit-log";

export function authenticateMockUser(username: string, password: string) {
  return (
    users.find(
      (user) =>
        user.username.toLowerCase() === username.toLowerCase() && user.password === password,
    ) ?? null
  );
}

export function getMockUserById(userId: string | null | undefined) {
  return users.find((user) => user.id === userId) ?? null;
}

export const taskService = {
  list: () => [...tasks],
  updateStatus: (taskId: string, status: TaskStatus, actorId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return null;
    const before = { status: task.status };
    task.status = status;
    recordAuditLog({
      actorId,
      action: "task.status.update",
      entityType: "task",
      entityId: taskId,
      before,
      after: { status },
    });
    return task;
  },
  assignTo: (taskId: string, assigneeId: string | null, actorId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return null;
    const before = { assignee: task.assignee };
    task.assignee = assigneeId;
    recordAuditLog({
      actorId,
      action: "task.assign",
      entityType: "task",
      entityId: taskId,
      before,
      after: { assignee: assigneeId },
    });
    return task;
  },
};

export const incidentService = {
  list: () => [...incidents],
  create: (
    actorId: string,
    input: Pick<Incident, "title" | "description" | "source" | "category">,
  ) => {
    const nextNumber =
      Math.max(...incidents.map((incident) => Number(incident.id.replace("INC-", "")))) + 1;
    const incident: Incident = {
      id: `INC-${nextNumber}`,
      title: input.title,
      description: input.description,
      source: input.source,
      sourceRef: "Manual Entry",
      category: input.category,
      subcategory: "General",
      severity: "SEV-3",
      status: "Unassigned",
      assignee: null,
      sla: "On Track",
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    };
    incidents.unshift(incident);
    recordAuditLog({
      actorId,
      action: "incident.create",
      entityType: "incident",
      entityId: incident.id,
      after: incident,
    });
    return incident;
  },
  assignTo: (incidentId: string, assigneeId: string, actorId: string) => {
    const incident = incidents.find((item) => item.id === incidentId);
    if (!incident) return null;
    const before = { assignee: incident.assignee, status: incident.status };
    incident.assignee = assigneeId;
    incident.status = "Assigned";
    recordAuditLog({
      actorId,
      action: "incident.assign",
      entityType: "incident",
      entityId: incidentId,
      before,
      after: { assignee: assigneeId, status: incident.status },
    });
    return incident;
  },
  updateStatus: (incidentId: string, status: IncidentStatus, actorId: string) => {
    const incident = incidents.find((item) => item.id === incidentId);
    if (!incident) return null;
    const before = { status: incident.status };
    incident.status = status;
    recordAuditLog({
      actorId,
      action: "incident.status.update",
      entityType: "incident",
      entityId: incidentId,
      before,
      after: { status },
    });
    return incident;
  },
  escalate: (incidentId: string, actorId: string) => {
    const incident = incidents.find((item) => item.id === incidentId);
    if (!incident) return null;
    const before = { severity: incident.severity };
    incident.severity = "SEV-1";
    recordAuditLog({
      actorId,
      action: "incident.escalate",
      entityType: "incident",
      entityId: incidentId,
      before,
      after: { severity: incident.severity },
    });
    return incident;
  },
};

function recalculateProjectCompletion(projectId: string) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;
  const tasksForProject = projectTasks.filter((task) => task.projectId === projectId);
  if (!tasksForProject.length) return project;
  project.completion = Math.round(
    tasksForProject.reduce((total, task) => total + task.completion, 0) / tasksForProject.length,
  );
  project.status =
    project.completion >= 100
      ? "Completed"
      : project.status === "Completed"
        ? "Active"
        : project.status;
  return project;
}

export const projectService = {
  list: () => [...projects],
  get: (projectId: string) => projects.find((project) => project.id === projectId) ?? null,
  listTasks: (projectId?: string) =>
    projectId ? projectTasks.filter((task) => task.projectId === projectId) : [...projectTasks],
  createTask: (projectId: string, actorId: string): ProjectTask | null => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return null;
    const nextNumber =
      Math.max(...projectTasks.map((task) => Number(task.id.replace("PT-", "")))) + 1;
    const task: ProjectTask = {
      id: `PT-${nextNumber}`,
      projectId,
      title: "New project task",
      description: "Mock project task created from the existing Add Project Task action",
      assignee: project.owner,
      status: "To Do",
      priority: "Medium",
      dueDate: project.targetDate,
      completion: 0,
      comments: 0,
      evidence: 0,
    };
    projectTasks.push(task);
    recalculateProjectCompletion(projectId);
    recordAuditLog({
      actorId,
      action: "project-task.create",
      entityType: "project-task",
      entityId: task.id,
      after: task,
    });
    return task;
  },
  updateTaskProgress: (taskId: string, completion: number, actorId: string) => {
    const task = projectTasks.find((item) => item.id === taskId);
    if (!task) return null;
    const nextCompletion = Math.max(0, Math.min(100, completion));
    const before = { completion: task.completion, status: task.status };
    task.completion = nextCompletion;
    task.status = nextCompletion >= 100 ? "Done" : nextCompletion > 0 ? "In Progress" : "To Do";
    const project = recalculateProjectCompletion(task.projectId);
    recordAuditLog({
      actorId,
      action: "project-task.progress.update",
      entityType: "project-task",
      entityId: task.id,
      before,
      after: {
        completion: task.completion,
        status: task.status,
        projectCompletion: project?.completion,
      },
    });
    return task;
  },
};

export const shiftService = {
  listSchedule: () => [...shifts],
};

export const shiftRequestService = {
  list: () => [...shiftRequests],
  updateStatus: (requestId: string, status: ShiftRequest["status"], actorId: string) => {
    const request = shiftRequests.find((item) => item.id === requestId);
    if (!request) return null;
    const before = { status: request.status, managerApproval: request.managerApproval };
    request.status = status;
    request.managerApproval = status === "Pending" ? "—" : `${status} by manager`;
    recordAuditLog({
      actorId,
      action: "shift-request.status.update",
      entityType: "shift-request",
      entityId: requestId,
      before,
      after: { status: request.status, managerApproval: request.managerApproval },
    });
    return request;
  },
};

export const handoverService = {
  list: () => [...handoverPoints],
  create: (actorId: string, shift: HandoverPoint["shift"]) => {
    const point: HandoverPoint = {
      id: `HP-${handoverPoints.length + 1}`,
      date: new Date().toISOString().slice(0, 10),
      shift,
      title: "New handover point",
      category: "General",
      priority: "Medium",
      status: "Open",
      owner: actorId,
      nextAction: "Review during next shift",
      notes: "Mock handover point created from the existing submit action.",
      evidence: 0,
      acknowledged: false,
      audit: "Pending",
    };
    handoverPoints.unshift(point);
    recordAuditLog({
      actorId,
      action: "handover.create",
      entityType: "handover",
      entityId: point.id,
      after: point,
    });
    return point;
  },
  updateAudit: (handoverId: string, audit: HandoverPoint["audit"], actorId: string) => {
    const handover = handoverPoints.find((item) => item.id === handoverId);
    if (!handover) return null;
    const before = { audit: handover.audit };
    handover.audit = audit;
    handover.acknowledged = audit === "Approved" ? true : handover.acknowledged;
    recordAuditLog({
      actorId,
      action: "handover.audit.update",
      entityType: "handover",
      entityId: handoverId,
      before,
      after: { audit: handover.audit, acknowledged: handover.acknowledged },
    });
    return handover;
  },
};

export const sopService = {
  list: () => [...sops],
  recordDownload: (sopId: string, actorId: string) => {
    const sop = sops.find((item) => item.id === sopId);
    if (!sop) return null;
    recordAuditLog({
      actorId,
      action: "sop.download",
      entityType: "sop",
      entityId: sopId,
      after: { title: sop.title },
    });
    return sop;
  },
};
