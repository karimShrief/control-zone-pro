import {
  categoryConfigs,
  coverageRules,
  handoverPoints,
  incidents,
  projectTasks,
  projects,
  roleConfigs,
  shiftRequests,
  shifts,
  shiftTypeConfigs,
  sops,
  statusConfigs,
  systemSettings,
  tasks,
  teamConfigs,
  users,
  userById,
  type CategoryConfig,
  type CoverageStatus,
  type Role,
  type RoleConfig,
  type Shift,
  type HandoverPoint,
  type Incident,
  type IncidentStatus,
  type ProjectTask,
  type ShiftRequest,
  type ShiftType,
  type ShiftTypeConfig,
  type StatusConfig,
  type SystemSettings,
  type TeamConfig,
  type TaskStatus,
  type User,
} from "./data";
import { recordAuditLog } from "./audit-log";

export function authenticateUser(username: string, password: string) {
  const user =
    users.find(
      (item) =>
        item.username.toLowerCase() === username.toLowerCase() && item.password === password,
    ) ?? null;
  return user?.status === "Inactive" ? null : user;
}

export function getUserById(userId: string | null | undefined) {
  return users.find((user) => user.id === userId) ?? null;
}

function nextNumericId(prefix: string, ids: string[]) {
  const next =
    Math.max(
      0,
      ...ids.map((id) => Number(id.replace(prefix, ""))).filter((value) => !Number.isNaN(value)),
    ) + 1;
  return `${prefix}${next}`;
}

function adminActor(actorId: string | undefined) {
  return actorId ?? "system";
}

function notifySystemSettingsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ops-system-settings-changed", { detail: systemSettings }));
}

export const userService = {
  list: () => [...users],
  create: (
    actorId: string,
    input: Pick<User, "name" | "username" | "role"> & { team?: string },
  ) => {
    const user: User = {
      id: nextNumericId(
        "u",
        users.map((item) => item.id),
      ),
      name: input.name,
      username: input.username,
      password: "change-me",
      role: input.role,
      team: input.team,
      status: "Active",
    };
    users.push(user);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "user.added",
      entityType: "user",
      entityId: user.id,
      after: user,
    });
    return user;
  },
  update: (
    userId: string,
    actorId: string,
    input: Partial<Pick<User, "name" | "username" | "role" | "team">>,
  ) => {
    const user = users.find((item) => item.id === userId);
    if (!user) return null;
    const before = { name: user.name, username: user.username, role: user.role, team: user.team };
    Object.assign(user, input);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: before.role !== user.role ? "user.role.changed" : "user.updated",
      entityType: "user",
      entityId: user.id,
      before,
      after: { name: user.name, username: user.username, role: user.role, team: user.team },
    });
    return user;
  },
  deactivate: (userId: string, actorId: string) => {
    const user = users.find((item) => item.id === userId);
    if (!user) return null;
    const before = { status: user.status ?? "Active" };
    user.status = "Inactive";
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "user.deactivated",
      entityType: "user",
      entityId: user.id,
      before,
      after: { status: user.status },
    });
    return user;
  },
  resetPassword: (userId: string, actorId: string) => {
    const user = users.find((item) => item.id === userId);
    if (!user) return null;
    user.password = "change-me";
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "user.password.reset",
      entityType: "user",
      entityId: user.id,
      after: { password: "temporary-reset" },
    });
    return user;
  },
};

export const roleService = {
  list: () => [...roleConfigs],
  update: (
    roleId: Role,
    actorId: string,
    input: Partial<Pick<RoleConfig, "description" | "enabled" | "modules">>,
  ) => {
    const role = roleConfigs.find((item) => item.id === roleId);
    if (!role) return null;
    const before = { description: role.description, enabled: role.enabled, modules: role.modules };
    Object.assign(role, input);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "role.updated",
      entityType: "role",
      entityId: role.id,
      before,
      after: { description: role.description, enabled: role.enabled, modules: role.modules },
    });
    return role;
  },
  toggleModule: (roleId: Role, module: RoleConfig["modules"][number], actorId: string) => {
    const role = roleConfigs.find((item) => item.id === roleId);
    if (!role) return null;
    const before = { modules: [...role.modules] };
    role.modules = role.modules.includes(module)
      ? role.modules.filter((item) => item !== module)
      : [...role.modules, module];
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "role.module-access.updated",
      entityType: "role",
      entityId: role.id,
      before,
      after: { modules: role.modules },
    });
    return role;
  },
};

export const teamService = {
  list: () => [...teamConfigs],
  create: (actorId: string, input: Pick<TeamConfig, "name" | "description">) => {
    const id = input.name
      .replace(/team/gi, "")
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 20);
    const team: TeamConfig = {
      id: id || `team-${teamConfigs.length + 1}`,
      name: input.name,
      description: input.description,
      active: true,
    };
    teamConfigs.push(team);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "team.added",
      entityType: "team",
      entityId: team.id,
      after: team,
    });
    return team;
  },
  update: (
    teamId: string,
    actorId: string,
    input: Partial<Pick<TeamConfig, "name" | "description" | "active">>,
  ) => {
    const team = teamConfigs.find((item) => item.id === teamId);
    if (!team) return null;
    const before = { name: team.name, description: team.description, active: team.active };
    Object.assign(team, input);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "team.updated",
      entityType: "team",
      entityId: team.id,
      before,
      after: { name: team.name, description: team.description, active: team.active },
    });
    return team;
  },
  remove: (teamId: string, actorId: string) => {
    const team = teamConfigs.find((item) => item.id === teamId);
    if (!team) return null;
    const before = { active: team.active };
    team.active = false;
    users.forEach((user) => {
      if (user.team === teamId) user.team = undefined;
    });
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "team.removed",
      entityType: "team",
      entityId: team.id,
      before,
      after: { active: team.active },
    });
    return team;
  },
  assignUsers: (teamId: string, userIds: string[], actorId: string) => {
    const before = users.filter((user) => user.team === teamId).map((user) => user.id);
    users.forEach((user) => {
      if (userIds.includes(user.id)) {
        user.team = teamId;
      } else if (user.team === teamId) {
        user.team = undefined;
      }
    });
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "team.users.assigned",
      entityType: "team",
      entityId: teamId,
      before: { users: before },
      after: { users: userIds },
    });
    return users.filter((user) => user.team === teamId);
  },
};

export const categoryService = {
  list: () => [...categoryConfigs],
  create: (actorId: string, input: Pick<CategoryConfig, "module" | "name">) => {
    const category: CategoryConfig = {
      id: `cat-${Date.now()}`,
      module: input.module,
      name: input.name,
      active: true,
    };
    categoryConfigs.push(category);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "category.added",
      entityType: "category",
      entityId: category.id,
      after: category,
    });
    return category;
  },
  update: (
    categoryId: string,
    actorId: string,
    input: Partial<Pick<CategoryConfig, "module" | "name" | "active">>,
  ) => {
    const category = categoryConfigs.find((item) => item.id === categoryId);
    if (!category) return null;
    const before = { module: category.module, name: category.name, active: category.active };
    Object.assign(category, input);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "category.updated",
      entityType: "category",
      entityId: category.id,
      before,
      after: { module: category.module, name: category.name, active: category.active },
    });
    return category;
  },
  remove: (categoryId: string, actorId: string) => {
    const category = categoryConfigs.find((item) => item.id === categoryId);
    if (!category) return null;
    const before = { active: category.active };
    category.active = false;
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "category.removed",
      entityType: "category",
      entityId: category.id,
      before,
      after: { active: category.active },
    });
    return category;
  },
};

export const statusConfigService = {
  list: () => [...statusConfigs],
  create: (actorId: string, input: Pick<StatusConfig, "module" | "name" | "tone">) => {
    const status: StatusConfig = {
      id: `status-${Date.now()}`,
      module: input.module,
      name: input.name,
      tone: input.tone,
      active: true,
    };
    statusConfigs.push(status);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "status.added",
      entityType: "status",
      entityId: status.id,
      after: status,
    });
    return status;
  },
  update: (
    statusId: string,
    actorId: string,
    input: Partial<Pick<StatusConfig, "module" | "name" | "tone" | "active">>,
  ) => {
    const status = statusConfigs.find((item) => item.id === statusId);
    if (!status) return null;
    const before = {
      module: status.module,
      name: status.name,
      tone: status.tone,
      active: status.active,
    };
    Object.assign(status, input);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "status.updated",
      entityType: "status",
      entityId: status.id,
      before,
      after: { module: status.module, name: status.name, tone: status.tone, active: status.active },
    });
    return status;
  },
  remove: (statusId: string, actorId: string) => {
    const status = statusConfigs.find((item) => item.id === statusId);
    if (!status) return null;
    const before = { active: status.active };
    status.active = false;
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "status.removed",
      entityType: "status",
      entityId: status.id,
      before,
      after: { active: status.active },
    });
    return status;
  },
};

export const systemConfigService = {
  get: () => ({ ...systemSettings }),
  update: (actorId: string, input: Partial<SystemSettings>) => {
    const before = { ...systemSettings };
    Object.assign(systemSettings, input);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "system.settings.updated",
      entityType: "system",
      entityId: "system-settings",
      before,
      after: { ...systemSettings },
    });
    notifySystemSettingsChanged();
    return systemSettings;
  },
  toggleModule: (module: SystemSettings["enabledModules"][number], actorId: string) => {
    const before = { enabledModules: [...systemSettings.enabledModules] };
    systemSettings.enabledModules = systemSettings.enabledModules.includes(module)
      ? systemSettings.enabledModules.filter((item) => item !== module)
      : [...systemSettings.enabledModules, module];
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "system.module-visibility.updated",
      entityType: "system",
      entityId: "enabled-modules",
      before,
      after: { enabledModules: systemSettings.enabledModules },
    });
    notifySystemSettingsChanged();
    return systemSettings;
  },
};

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
    const incident: Incident = {
      id: nextNumericId(
        "INC-",
        incidents.map((incident) => incident.id),
      ),
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
    const task: ProjectTask = {
      id: nextNumericId(
        "PT-",
        projectTasks.map((task) => task.id),
      ),
      projectId,
      title: "New project task",
      description: "Project task created from the Add Project Task action",
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

function shiftId(date: string, type: ShiftType) {
  return `${date}-${type}`;
}

function findShift(date: string, type: ShiftType) {
  return shifts.find((item) => item.date === date && item.type === type) ?? null;
}

function ensureShift(date: string, type: ShiftType) {
  const existing = findShift(date, type);
  if (existing) return existing;
  const shift: Shift = {
    date,
    type,
    engineers: [],
    coverageStatus: "Pending Update",
    notes: "Created from roster action.",
  };
  shifts.push(shift);
  return shift;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function hasSameDayConflict(shift: Shift) {
  return shift.engineers.some((engineerId) =>
    shifts.some(
      (item) =>
        item.date === shift.date && item.type !== shift.type && item.engineers.includes(engineerId),
    ),
  );
}

function derivedCoverageStatus(shift: Shift): CoverageStatus {
  const config = shiftTypeConfigs.find((item) => item.name === shift.type);
  const minimum = config?.minEngineers ?? coverageRules.defaultMinimumEngineers;
  if (coverageRules.preventOverlappingAssignments && hasSameDayConflict(shift)) return "Conflict";
  if (shift.engineers.length < minimum) return "Understaffed";
  if (coverageRules.requireShiftLead && !shift.shiftLead) return "Pending Update";
  return shift.coverageStatus ?? "Covered";
}

function shiftWithDerivedStatus(shift: Shift): Shift {
  return { ...shift, coverageStatus: derivedCoverageStatus(shift) };
}

function datesForMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) return [];
  const dates: string[] = [];
  const cursor = new Date(Date.UTC(year, monthNumber - 1, 1));
  while (cursor.getUTCMonth() === monthNumber - 1) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function applyApprovedShiftRequest(request: ShiftRequest, actorId: string) {
  const current = ensureShift(request.requestedDate, request.currentShift);
  const target = ensureShift(request.requestedDate, request.requestedShift);
  const before = {
    current: { ...current, engineers: [...current.engineers] },
    target: { ...target, engineers: [...target.engineers] },
  };

  if (request.type === "Shift Swap" || request.type === "Change Shift") {
    current.engineers = current.engineers.filter((id) => id !== request.requester);
    if (!target.engineers.includes(request.requester)) target.engineers.push(request.requester);
    if (current.shiftLead === request.requester) current.shiftLead = current.engineers[0];
    target.notes =
      `${target.notes ?? ""} ${userById(request.requester)} moved from ${request.currentShift}.`.trim();
    current.notes =
      `${current.notes ?? ""} ${userById(request.requester)} removed after approved request.`.trim();
  }

  if (request.type === "Leave Early" || request.type === "Absence Note") {
    current.notes =
      `${current.notes ?? ""} ${request.type}: ${userById(request.requester)} - ${request.reason}.`.trim();
  }

  current.coverageStatus = derivedCoverageStatus(current);
  target.coverageStatus = derivedCoverageStatus(target);

  recordAuditLog({
    actorId: adminActor(actorId),
    action: "roster.modified",
    entityType: "shift",
    entityId: shiftId(request.requestedDate, request.currentShift),
    before,
    after: {
      current: shiftWithDerivedStatus(current),
      target: shiftWithDerivedStatus(target),
      sourceRequest: request.id,
    },
  });
}

export const shiftService = {
  listSchedule: () => shifts.map(shiftWithDerivedStatus),
  listShiftTypes: () => [...shiftTypeConfigs],
  getCoverageRules: () => ({ ...coverageRules }),
  currentShiftType: (now = new Date()): ShiftType => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const match = shiftTypeConfigs.find((config) => {
      const start = timeToMinutes(config.startTime);
      const end = timeToMinutes(config.endTime);
      return start <= end
        ? currentMinutes >= start && currentMinutes < end
        : currentMinutes >= start || currentMinutes < end;
    });
    return match?.name ?? "Morning";
  },
  getCoverageStatus: derivedCoverageStatus,
  createShift: (actorId: string, input: Shift) => {
    if (findShift(input.date, input.type)) return null;
    const engineers = Array.from(new Set(input.engineers));
    if (input.shiftLead && !engineers.includes(input.shiftLead)) engineers.push(input.shiftLead);
    const shift: Shift = {
      date: input.date,
      type: input.type,
      engineers,
      shiftLead: input.shiftLead,
      coverageStatus: input.coverageStatus ?? "Pending Update",
      notes: input.notes,
    };
    shift.coverageStatus = derivedCoverageStatus(shift);
    shifts.push(shift);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "shift.created",
      entityType: "shift",
      entityId: shiftId(shift.date, shift.type),
      after: shiftWithDerivedStatus(shift),
    });
    return shiftWithDerivedStatus(shift);
  },
  deleteShift: (date: string, type: ShiftType, actorId: string) => {
    const index = shifts.findIndex((item) => item.date === date && item.type === type);
    if (index === -1) return null;
    const [shift] = shifts.splice(index, 1);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "shift.deleted",
      entityType: "shift",
      entityId: shiftId(date, type),
      before: shift,
      after: { deleted: true },
    });
    return shift;
  },
  importShifts: (actorId: string, input: Shift[]) => {
    let created = 0;
    let updated = 0;
    input.forEach((incoming) => {
      const existing = findShift(incoming.date, incoming.type);
      const engineers = Array.from(new Set(incoming.engineers));
      if (incoming.shiftLead && !engineers.includes(incoming.shiftLead)) {
        engineers.push(incoming.shiftLead);
      }

      if (existing) {
        existing.engineers = engineers;
        existing.shiftLead = incoming.shiftLead;
        existing.coverageStatus = incoming.coverageStatus ?? "Pending Update";
        existing.notes = incoming.notes;
        existing.coverageStatus = derivedCoverageStatus(existing);
        updated += 1;
        return;
      }

      const shift: Shift = {
        ...incoming,
        engineers,
        coverageStatus: incoming.coverageStatus ?? "Pending Update",
      };
      shift.coverageStatus = derivedCoverageStatus(shift);
      shifts.push(shift);
      created += 1;
    });
    const result = { total: input.length, created, updated };
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "roster.imported",
      entityType: "shift",
      entityId: "roster-import",
      after: result,
    });
    return result;
  },
  buildMonthlyRoster: (
    actorId: string,
    input: {
      month: string;
      shiftTypes: ShiftType[];
      engineers: string[];
      shiftLead?: string;
      notes?: string;
      overwriteExisting: boolean;
    },
  ) => {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const dates = datesForMonth(input.month);

    dates.forEach((date) => {
      input.shiftTypes.forEach((type) => {
        const existing = findShift(date, type);
        if (existing && !input.overwriteExisting) {
          skipped += 1;
          return;
        }

        const engineers = Array.from(new Set(input.engineers));
        if (input.shiftLead && !engineers.includes(input.shiftLead))
          engineers.push(input.shiftLead);

        if (existing) {
          existing.engineers = engineers;
          existing.shiftLead = input.shiftLead;
          existing.coverageStatus = "Pending Update";
          existing.notes = input.notes;
          existing.coverageStatus = derivedCoverageStatus(existing);
          updated += 1;
          return;
        }

        const shift: Shift = {
          date,
          type,
          engineers,
          shiftLead: input.shiftLead,
          coverageStatus: "Pending Update",
          notes: input.notes,
        };
        shift.coverageStatus = derivedCoverageStatus(shift);
        shifts.push(shift);
        created += 1;
      });
    });

    const result = {
      month: input.month,
      total: dates.length * input.shiftTypes.length,
      created,
      updated,
      skipped,
    };
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "roster.month-built",
      entityType: "shift",
      entityId: `roster-month-${input.month}`,
      after: result,
    });
    return result;
  },
  listConflicts: () => {
    const conflicts: Array<{ date: string; engineerId: string; shifts: ShiftType[] }> = [];
    const dates = Array.from(new Set(shifts.map((shift) => shift.date)));
    dates.forEach((date) => {
      users.forEach((user) => {
        const assigned = shifts
          .filter((shift) => shift.date === date && shift.engineers.includes(user.id))
          .map((shift) => shift.type);
        if (assigned.length > 1) conflicts.push({ date, engineerId: user.id, shifts: assigned });
      });
    });
    return conflicts;
  },
  updateShift: (
    date: string,
    type: ShiftType,
    actorId: string,
    input: Partial<Pick<Shift, "engineers" | "shiftLead" | "coverageStatus" | "notes">>,
  ) => {
    const shift = ensureShift(date, type);
    const before = { ...shift, engineers: [...shift.engineers] };
    if (input.engineers) shift.engineers = Array.from(new Set(input.engineers));
    if (input.shiftLead !== undefined) shift.shiftLead = input.shiftLead;
    if (input.coverageStatus) shift.coverageStatus = input.coverageStatus;
    if (input.notes !== undefined) shift.notes = input.notes;
    shift.coverageStatus = derivedCoverageStatus(shift);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "shift.updated",
      entityType: "shift",
      entityId: shiftId(date, type),
      before,
      after: shiftWithDerivedStatus(shift),
    });
    return shiftWithDerivedStatus(shift);
  },
  addEngineer: (date: string, type: ShiftType, engineerId: string, actorId: string) => {
    const shift = ensureShift(date, type);
    const before = { engineers: [...shift.engineers] };
    if (!shift.engineers.includes(engineerId)) shift.engineers.push(engineerId);
    shift.coverageStatus = derivedCoverageStatus(shift);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "roster.engineer.added",
      entityType: "shift",
      entityId: shiftId(date, type),
      before,
      after: { engineers: shift.engineers, coverageStatus: shift.coverageStatus },
    });
    return shiftWithDerivedStatus(shift);
  },
  removeEngineer: (date: string, type: ShiftType, engineerId: string, actorId: string) => {
    const shift = ensureShift(date, type);
    const before = { engineers: [...shift.engineers], shiftLead: shift.shiftLead };
    shift.engineers = shift.engineers.filter((id) => id !== engineerId);
    if (shift.shiftLead === engineerId) shift.shiftLead = shift.engineers[0];
    shift.coverageStatus = derivedCoverageStatus(shift);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "roster.engineer.removed",
      entityType: "shift",
      entityId: shiftId(date, type),
      before,
      after: {
        engineers: shift.engineers,
        shiftLead: shift.shiftLead,
        coverageStatus: shift.coverageStatus,
      },
    });
    return shiftWithDerivedStatus(shift);
  },
  addNote: (date: string, type: ShiftType, note: string, actorId: string) => {
    const shift = ensureShift(date, type);
    const before = { notes: shift.notes };
    shift.notes = note;
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "shift.note.updated",
      entityType: "shift",
      entityId: shiftId(date, type),
      before,
      after: { notes: shift.notes },
    });
    return shiftWithDerivedStatus(shift);
  },
  updateShiftType: (shiftTypeId: string, actorId: string, input: Partial<ShiftTypeConfig>) => {
    const config = shiftTypeConfigs.find((item) => item.id === shiftTypeId);
    if (!config) return null;
    const before = { ...config };
    Object.assign(config, input);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "shift-type.updated",
      entityType: "shift",
      entityId: shiftTypeId,
      before,
      after: { ...config },
    });
    return config;
  },
  updateCoverageRules: (actorId: string, input: Partial<typeof coverageRules>) => {
    const before = { ...coverageRules };
    Object.assign(coverageRules, input);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "coverage-rules.updated",
      entityType: "shift",
      entityId: "coverage-rules",
      before,
      after: { ...coverageRules },
    });
    return coverageRules;
  },
};

export const shiftRequestService = {
  list: () => [...shiftRequests],
  create: (
    actorId: string,
    input: Pick<
      ShiftRequest,
      "type" | "requester" | "requestedDate" | "currentShift" | "requestedShift" | "reason"
    >,
  ) => {
    const request: ShiftRequest = {
      id: `SR-${shiftRequests.length + 1}`,
      ...input,
      status: "Pending",
      managerApproval: "-",
    };
    shiftRequests.unshift(request);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "shift-request.submitted",
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
    request.managerApproval = status === "Pending" ? "-" : `${status} by ${userById(actorId)}`;
    if (status === "Approved") applyApprovedShiftRequest(request, actorId);
    recordAuditLog({
      actorId,
      action:
        status === "Approved"
          ? "shift-request.approved"
          : status === "Rejected"
            ? "shift-request.rejected"
            : "shift-request.status.update",
      entityType: "shift-request",
      entityId: requestId,
      before,
      after: { status: request.status, managerApproval: request.managerApproval },
    });
    request.managerApproval = status === "Pending" ? "-" : `${status} by ${userById(actorId)}`;
    return request;
  },
};

export const handoverService = {
  list: () => [...handoverPoints],
  create: (
    actorId: string,
    shiftOrInput:
      | HandoverPoint["shift"]
      | (Pick<
          HandoverPoint,
          "date" | "shift" | "title" | "category" | "priority" | "nextAction" | "notes"
        > &
          Partial<Pick<HandoverPoint, "status" | "relatedRef" | "evidence">>),
  ) => {
    const input =
      typeof shiftOrInput === "string"
        ? {
            date: new Date().toISOString().slice(0, 10),
            shift: shiftOrInput,
            title: "New handover point",
            category: "General" as HandoverPoint["category"],
            priority: "Medium" as HandoverPoint["priority"],
            status: "Open" as HandoverPoint["status"],
            nextAction: "Review during next shift",
            notes: "Handover point created from the submit action.",
            evidence: 0,
          }
        : {
            ...shiftOrInput,
            status: shiftOrInput.status ?? ("Open" as HandoverPoint["status"]),
            evidence: shiftOrInput.evidence ?? 0,
          };
    const point: HandoverPoint = {
      id: `HP-${handoverPoints.length + 1}`,
      date: input.date,
      shift: input.shift,
      title: input.title,
      category: input.category,
      priority: input.priority,
      status: input.status,
      owner: actorId,
      relatedRef: input.relatedRef,
      nextAction: input.nextAction,
      notes: input.notes,
      evidence: input.evidence,
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
