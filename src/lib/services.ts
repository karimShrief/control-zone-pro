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
  type Priority,
  type ProjectTask,
  type Role,
  type ShiftRequest,
  type Task,
  type TaskStatus,
  type User,
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

export const userService = {
  list: () => [...users],
  create: (
    actorId: string,
    input: Pick<User, "name" | "username" | "role"> & { team?: User["team"] },
  ) => {
    const username = input.username.trim().toLowerCase();
    if (!username || users.some((user) => user.username.toLowerCase() === username)) return null;
    const nextNumber =
      Math.max(0, ...users.map((user) => Number(user.id.replace("u", ""))).filter(Boolean)) + 1;
    const user: User = {
      id: `u${nextNumber}`,
      username,
      password: "demo",
      name: input.name.trim(),
      role: input.role,
      team: input.team,
    };
    users.push(user);
    recordAuditLog({
      actorId,
      action: "user.create",
      entityType: "user",
      entityId: user.id,
      after: { username: user.username, role: user.role, team: user.team },
    });
    return user;
  },
  update: (
    userId: string,
    actorId: string,
    input: Partial<Pick<User, "name" | "username">> & { role?: Role; team?: User["team"] },
  ) => {
    const user = users.find((item) => item.id === userId);
    if (!user) return null;

    const nextUsername = input.username?.trim().toLowerCase();
    if (
      nextUsername &&
      users.some((item) => item.id !== userId && item.username.toLowerCase() === nextUsername)
    ) {
      return null;
    }

    const before = {
      name: user.name,
      username: user.username,
      role: user.role,
      team: user.team,
    };
    if (input.name?.trim()) user.name = input.name.trim();
    if (nextUsername) user.username = nextUsername;
    if (input.role) user.role = input.role;
    if ("team" in input) user.team = input.team;

    recordAuditLog({
      actorId,
      action: "user.update",
      entityType: "user",
      entityId: user.id,
      before,
      after: { name: user.name, username: user.username, role: user.role, team: user.team },
    });
    return user;
  },
};

export const taskService = {
  list: () => [...tasks],
  get: (taskId: string) => tasks.find((task) => task.id === taskId) ?? null,
  create: (actorId: string): Task => {
    const nextNumber =
      Math.max(0, ...tasks.map((task) => Number(task.id.replace("T-", ""))).filter(Boolean)) + 1;
    const task: Task = {
      id: `T-${nextNumber}`,
      title: "New operations task",
      description: "Mock task created from the existing Add Task action.",
      type: "General Task",
      category: "Operations",
      priority: "Medium",
      impact: "Medium",
      status: "New",
      assignee: null,
      dueDate: new Date().toISOString().slice(0, 10),
      sla: "On Track",
      comments: 0,
      evidence: 0,
      audit: "Pending",
    };
    tasks.unshift(task);
    recordAuditLog({
      actorId,
      action: "task.create",
      entityType: "task",
      entityId: task.id,
      after: task,
    });
    return task;
  },
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
  create: (
    actorId: string,
    input: Pick<
      ShiftRequest,
      "type" | "requestedDate" | "currentShift" | "requestedShift" | "reason"
    >,
  ) => {
    const nextNumber =
      Math.max(0, ...shiftRequests.map((request) => Number(request.id.replace("SR-", "")))) + 1;
    const request: ShiftRequest = {
      id: `SR-${nextNumber}`,
      type: input.type,
      requester: actorId,
      requestedDate: input.requestedDate,
      currentShift: input.currentShift,
      requestedShift: input.requestedShift,
      reason: input.reason,
      status: "Pending",
      managerApproval: "-",
    };
    shiftRequests.unshift(request);
    recordAuditLog({
      actorId,
      action: "shift-request.create",
      entityType: "shift-request",
      entityId: request.id,
      after: request,
    });
    return request;
  },
  updateStatus: (requestId: string, status: ShiftRequest["status"], actorId: string) => {
    const request = shiftRequests.find((item) => item.id === requestId);
    if (!request) return null;
    const before = { status: request.status, managerApproval: request.managerApproval };
    request.status = status;
    request.managerApproval = status === "Pending" ? "-" : `${status} by manager`;
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
  create: (
    actorId: string,
    input: {
      shift: HandoverPoint["shift"];
      title?: string;
      category?: HandoverPoint["category"];
      priority?: Priority;
      status?: HandoverPoint["status"];
      relatedRef?: string;
      nextAction?: string;
      notes?: string;
    },
  ) => {
    const nextNumber =
      Math.max(0, ...handoverPoints.map((point) => Number(point.id.replace("HP-", "")))) + 1;
    const point: HandoverPoint = {
      id: `HP-${nextNumber}`,
      date: new Date().toISOString().slice(0, 10),
      shift: input.shift,
      title: input.title?.trim() || "New handover point",
      category: input.category ?? "General",
      priority: input.priority ?? "Medium",
      status: input.status ?? "Open",
      owner: actorId,
      relatedRef: input.relatedRef?.trim() || undefined,
      nextAction: input.nextAction?.trim() || "Review during next shift",
      notes: input.notes?.trim() || "Mock handover point created from the handover form.",
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
  acknowledge: (handoverId: string, actorId: string) => {
    const handover = handoverPoints.find((item) => item.id === handoverId);
    if (!handover) return null;
    const before = { acknowledged: handover.acknowledged };
    handover.acknowledged = true;
    recordAuditLog({
      actorId,
      action: "handover.acknowledge",
      entityType: "handover",
      entityId: handoverId,
      before,
      after: { acknowledged: handover.acknowledged },
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
