import {
  categoryConfigs,
  coverageRules,
  dashboardWidgetSettings,
  handoverPoints,
  handoverTemplates,
  importTemplateDefinitions,
  incidentRules,
  incidents,
  projectTasks,
  projectTemplates,
  projects,
  roleConfigs,
  rosterRules,
  shiftRequests,
  shifts,
  shiftTypeConfigs,
  slaEscalationPolicies,
  sopSettings,
  sops,
  statusConfigs,
  systemSettings,
  taskTemplates,
  tasks,
  teamConfigs,
  users,
  userById,
  type DashboardWidgetSetting,
  type CategoryConfig,
  type CoverageStatus,
  type Role,
  type RoleConfig,
  type Shift,
  type HandoverComment,
  type HandoverPoint,
  type HandoverTemplate,
  type ImportJob,
  type ImportJobRow,
  type ImportJobStatus,
  type ImportRowStatus,
  type ImportTemplateDefinition,
  type ImportType,
  type IncidentCategory,
  type Incident,
  type IncidentRule,
  type IncidentStatus,
  type ProjectTask,
  type ProjectTemplate,
  type RosterRule,
  type SlaEscalationPolicy,
  type ShiftRequest,
  type ShiftType,
  type ShiftTypeConfig,
  type SopSetting,
  type StatusConfig,
  type SystemSettings,
  type TeamConfig,
  type TaskTemplate,
  type TaskStatus,
  type User,
} from "./data";
import { listAuditLogs, recordAuditLog, type AuditEntityType } from "./audit-log";
import { mockRepositories } from "./repositories/mock-database";

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

export const auditService = {
  list: () => listAuditLogs(),
};

export const availabilityService = {
  list: () =>
    users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      availability: user.availability ?? "Available",
      availabilityReason: user.availabilityReason ?? "Available for rotation",
    })),
  summary: () => {
    const statuses = users.reduce(
      (summary, user) => {
        const availability = user.availability ?? "Available";
        summary[availability] = (summary[availability] ?? 0) + 1;
        return summary;
      },
      {} as Record<string, number>,
    );

    return {
      total: users.length,
      available: statuses["Available"] ?? 0,
      external: statuses["External Activity"] ?? 0,
      emergency: statuses["Emergency Leave"] ?? 0,
      offDuty: statuses["Off Duty"] ?? 0,
      onLeave: statuses["On Leave"] ?? 0,
    };
  },
  get: (userId: string) => {
    const user = users.find((item) => item.id === userId);
    return {
      id: user?.id ?? userId,
      name: user?.name ?? userId,
      role: user?.role ?? "engineer",
      availability: user?.availability ?? "Available",
      availabilityReason: user?.availabilityReason ?? "Available for rotation",
    };
  },
};

function nextNumericId(prefix: string, ids: string[]) {
  const next =
    Math.max(
      0,
      ...ids.map((id) => Number(id.replace(prefix, ""))).filter((value) => !Number.isNaN(value)),
    ) + 1;
  return `${prefix}${next}`;
}

function readMockStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeMockStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function hydrateMockTasks() {
  if (typeof window === "undefined") return;
  const stored = readMockStorage<Task[]>("ops-command-mock-tasks", []);
  if (stored.length) {
    tasks.splice(0, tasks.length, ...stored);
  } else {
    writeMockStorage("ops-command-mock-tasks", tasks);
  }
}

function hydrateMockShifts() {
  if (typeof window === "undefined") return;
  const stored = readMockStorage<Shift[]>("ops-command-mock-shifts", []);
  if (stored.length) {
    shifts.splice(0, shifts.length, ...stored);
  } else {
    writeMockStorage("ops-command-mock-shifts", shifts);
  }
}

function hydrateMockIncidents() {
  if (typeof window === "undefined") return;
  const stored = readMockStorage<Incident[]>("ops-command-mock-incidents", []);
  if (stored.length) {
    incidents.splice(0, incidents.length, ...stored);
  } else {
    writeMockStorage("ops-command-mock-incidents", incidents);
  }
}

hydrateMockTasks();
hydrateMockShifts();
hydrateMockIncidents();

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

const repositories = mockRepositories;

function timestamp() {
  return new Date().toISOString();
}

function createImportId() {
  return `IMP-${Date.now()}`;
}

function isKnownUserReference(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "shared") return true;
  return users.some(
    (user) =>
      user.id.toLowerCase() === normalized ||
      user.username.toLowerCase() === normalized ||
      user.name.toLowerCase() === normalized,
  );
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return false;
  return !Number.isNaN(new Date(`${value.trim()}T00:00:00`).getTime());
}

function isValidDateTime(value: string) {
  const normalized = value.trim().replace(" ", "T");
  return !Number.isNaN(new Date(normalized).getTime());
}

function keyForImportRow(type: ImportType, row: Record<string, string>) {
  const keys: Record<ImportType, string[]> = {
    Users: ["username"],
    Tasks: ["title", "dueDate"],
    Incidents: ["title", "createdTime"],
    Projects: ["projectName"],
    "Project Tasks/Subtasks": ["projectId", "title"],
    "Shift Roster": ["date", "shiftType"],
    "Shift Requests": ["requester", "requestedDate", "currentShift", "requestedShift"],
    "Handover Points": ["date", "shiftType", "title"],
    "SOP Metadata": ["title", "version"],
  };
  return keys[type].map((key) => row[key]?.trim().toLowerCase() ?? "").join("|");
}

function createMockRows(template: ImportTemplateDefinition, jobId: string): ImportJobRow[] {
  const base = Object.fromEntries(
    template.fields.map((field) => [field.name, field.example]),
  ) as Record<string, string>;
  const requiredField = template.fields.find((field) => field.required)?.name;
  const missing = { ...base };
  if (requiredField) missing[requiredField] = "";
  const warning = { ...base };
  if ("assignedEngineer" in warning) warning.assignedEngineer = "Unknown Engineer";
  if ("assignedEngineers" in warning) warning.assignedEngineers = "engineer; Unknown Engineer";
  if ("assignee" in warning) warning.assignee = "Unknown Engineer";
  if ("owner" in warning) warning.owner = "Unknown Owner";
  if ("shiftLead" in warning) warning.shiftLead = "Unknown Lead";
  if ("dueDate" in warning) warning.dueDate = "15/08/2026";
  if ("targetDate" in warning) warning.targetDate = "15/09/2026";
  if ("lastUpdated" in warning) warning.lastUpdated = "15/08/2026";
  if ("createdTime" in warning) warning.createdTime = "15-08-2026";
  if ("priority" in warning) warning.priority = "Urgent";
  if ("shiftType" in warning) warning.shiftType = "Day";
  if ("status" in warning) warning.status = "Started";

  return [base, { ...base }, missing, warning].map((preview, index) => ({
    id: `${jobId}-ROW-${index + 1}`,
    jobId,
    rowNumber: index + 1,
    preview,
    validationStatus: "Valid",
    messages: [],
  }));
}

function validateImportRows(type: ImportType, rows: ImportJobRow[]) {
  const seen = new Set<string>();
  return rows.map((row) => {
    const messages: string[] = [];
    const template = importTemplateDefinitions.find((item) => item.type === type);
    template?.fields
      .filter((field) => field.required)
      .forEach((field) => {
        if (!row.preview[field.name]?.trim())
          messages.push(`Missing required field: ${field.name}`);
      });

    const userFields = [
      "assignedEngineer",
      "assignee",
      "owner",
      "sponsor",
      "requester",
      "shiftLead",
    ];
    userFields.forEach((field) => {
      const value = row.preview[field];
      if (value?.trim() && !isKnownUserReference(value)) {
        messages.push(`Unknown engineer/user reference: ${value}`);
      }
    });

    const assignedEngineers = row.preview.assignedEngineers;
    if (assignedEngineers?.trim()) {
      assignedEngineers
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((engineer) => {
          if (!isKnownUserReference(engineer)) messages.push(`Unknown engineer name: ${engineer}`);
        });
    }

    if (
      row.preview.priority &&
      !["Low", "Medium", "High", "Critical"].includes(row.preview.priority)
    ) {
      messages.push(`Invalid priority: ${row.preview.priority}`);
    }
    if (
      row.preview.severity &&
      !["SEV-1", "SEV-2", "SEV-3", "SEV-4"].includes(row.preview.severity)
    ) {
      messages.push(`Invalid severity: ${row.preview.severity}`);
    }
    if (row.preview.shiftType && !["Morning", "Evening", "Night"].includes(row.preview.shiftType)) {
      messages.push(`Invalid shift type: ${row.preview.shiftType}`);
    }
    ["currentShift", "requestedShift"].forEach((field) => {
      const value = row.preview[field];
      if (value && !["Morning", "Evening", "Night"].includes(value)) {
        messages.push(`Invalid shift type: ${value}`);
      }
    });

    const statusFields: Array<[string, string[]]> = [
      [
        "status",
        [
          "New",
          "To Do",
          "Planning",
          "Active",
          "Unassigned",
          "Assigned",
          "Accepted",
          "In Progress",
          "Pending",
          "Resolved",
          "Closed",
          "Completed",
        ],
      ],
      ["slaStatus", ["On Track", "At Risk", "Breached"]],
      ["coverageStatus", ["Covered", "Understaffed", "Pending Update", "Conflict"]],
      ["approvalStatus", ["Draft", "In Review", "Approved", "Needs Update"]],
    ];
    statusFields.forEach(([field, allowed]) => {
      const value = row.preview[field];
      if (value && !allowed.includes(value)) messages.push(`Invalid status: ${value}`);
    });

    ["date", "dueDate", "startDate", "targetDate", "requestedDate", "lastUpdated"].forEach(
      (field) => {
        const value = row.preview[field];
        if (value && !isValidDate(value)) messages.push(`Invalid date format: ${field}`);
      },
    );
    if (row.preview.createdTime && !isValidDateTime(row.preview.createdTime)) {
      messages.push("Invalid date format: createdTime");
    }

    const rowKey = keyForImportRow(type, row.preview);
    if (rowKey && seen.has(rowKey)) messages.push("Duplicate record in uploaded file");
    if (rowKey) seen.add(rowKey);

    const hasError = messages.some(
      (message) =>
        message.startsWith("Missing") ||
        message.startsWith("Invalid") ||
        message.startsWith("Duplicate"),
    );
    const validationStatus: ImportRowStatus = hasError
      ? "Error"
      : messages.length
        ? "Warning"
        : "Valid";
    return { ...row, validationStatus, messages };
  });
}

function summarizeImportRows(rows: ImportJobRow[]) {
  const errors = rows.filter((row) => row.validationStatus === "Error").length;
  const warnings = rows.filter((row) => row.validationStatus === "Warning").length;
  const valid = rows.length - errors;
  return { total: rows.length, valid, warnings, errors };
}

function recordImportAudit(
  actorId: string,
  action: string,
  job: Pick<ImportJob, "id" | "importType" | "totalRecords" | "status" | "notes">,
  result: string,
) {
  recordAuditLog({
    actorId: adminActor(actorId),
    action,
    entityType: "import-job",
    entityId: job.id,
    after: job,
    metadata: {
      module: "Import Center",
      changedBy: actorId,
      timestamp: timestamp(),
      importType: job.importType,
      recordCount: job.totalRecords,
      result,
      notes: job.notes,
    },
  });
}

export const importService = {
  listTemplates: () => [...importTemplateDefinitions],
  listJobs: () => repositories.imports.listJobs(),
  listRows: (jobId: string) => repositories.imports.listRows(jobId),
  allowedTypesForRole: (role: Role | undefined) =>
    role
      ? importTemplateDefinitions.filter((template) => template.allowedRoles.includes(role))
      : [],
  canImportType: (role: Role | undefined, type: ImportType) =>
    !!role &&
    importTemplateDefinitions.some(
      (template) => template.type === type && template.allowedRoles.includes(role),
    ),
  downloadTemplate: (actorId: string, type: ImportType) => {
    const template = importTemplateDefinitions.find((item) => item.type === type);
    if (!template) return "";
    const header = template.fields.map((field) => field.name).join(",");
    const sample = template.fields.map((field) => field.example).join(",");
    const job: ImportJob = {
      id: createImportId(),
      importType: type,
      uploadedBy: actorId,
      fileName: `${type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-template.csv`,
      totalRecords: 0,
      recordsImported: 0,
      recordsFailed: 0,
      recordsWithWarnings: 0,
      status: "Draft",
      notes: "Template downloaded",
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };
    repositories.imports.upsertJob(job);
    recordImportAudit(actorId, "import.template.downloaded", job, "Template downloaded");
    return `${header}\n${sample}\n`;
  },
  uploadFile: (actorId: string, type: ImportType, fileName: string) => {
    const template = importTemplateDefinitions.find((item) => item.type === type);
    if (!template) return null;
    const now = timestamp();
    const job: ImportJob = {
      id: createImportId(),
      importType: type,
      uploadedBy: actorId,
      fileName,
      totalRecords: 4,
      recordsImported: 0,
      recordsFailed: 0,
      recordsWithWarnings: 0,
      status: "Draft",
      notes: "Mock file uploaded. Run validation before confirming import.",
      createdAt: now,
      updatedAt: now,
    };
    repositories.imports.upsertJob(job);
    repositories.imports.replaceRows(job.id, createMockRows(template, job.id));
    recordImportAudit(actorId, "import.file.uploaded", job, "File uploaded");
    return job;
  },
  validate: (actorId: string, jobId: string) => {
    const job = repositories.imports.getJob(jobId);
    if (!job) return null;
    const rows = validateImportRows(job.importType, repositories.imports.listRows(jobId));
    repositories.imports.replaceRows(jobId, rows);
    const summary = summarizeImportRows(rows);
    const status: ImportJobStatus = summary.errors === rows.length ? "Failed" : "Validated";
    const updated: ImportJob = {
      ...job,
      totalRecords: summary.total,
      recordsImported: 0,
      recordsFailed: summary.errors,
      recordsWithWarnings: summary.warnings,
      status,
      notes:
        summary.errors > 0
          ? "Validation completed with errors. Fix errors before production import."
          : "Validation completed. Ready to confirm.",
      updatedAt: timestamp(),
    };
    repositories.imports.upsertJob(updated);
    recordImportAudit(actorId, "import.validation.completed", updated, updated.status);
    return updated;
  },
  confirm: (actorId: string, jobId: string) => {
    const job = repositories.imports.getJob(jobId);
    if (!job) return null;
    const rows = repositories.imports.listRows(jobId);
    const summary = summarizeImportRows(rows);
    const updated: ImportJob = {
      ...job,
      recordsImported: summary.valid,
      recordsFailed: summary.errors,
      recordsWithWarnings: summary.warnings,
      status: summary.valid > 0 ? "Imported" : "Failed",
      notes:
        summary.valid > 0
          ? "Mock import completed. Future MySQL implementation will write valid rows to target tables."
          : "Import failed because no valid rows were available.",
      updatedAt: timestamp(),
    };
    repositories.imports.upsertJob(updated);
    recordImportAudit(
      actorId,
      updated.status === "Imported" ? "import.confirmed" : "import.failed",
      updated,
      updated.status,
    );
    return updated;
  },
  cancel: (actorId: string, jobId: string) => {
    const job = repositories.imports.getJob(jobId);
    if (!job) return null;
    const updated: ImportJob = {
      ...job,
      status: "Cancelled",
      notes: "Import cancelled before confirmation.",
      updatedAt: timestamp(),
    };
    repositories.imports.upsertJob(updated);
    recordImportAudit(actorId, "import.cancelled", updated, "Cancelled");
    return updated;
  },
  rerun: (actorId: string, jobId: string) => {
    const job = repositories.imports.getJob(jobId);
    if (!job) return null;
    return importService.uploadFile(actorId, job.importType, `rerun-${job.fileName}`);
  },
  errorReport: (actorId: string, jobId: string) => {
    const job = repositories.imports.getJob(jobId);
    if (!job) return "";
    const rows = repositories.imports
      .listRows(jobId)
      .filter((row) => row.validationStatus !== "Valid");
    recordImportAudit(actorId, "import.error-report.downloaded", job, "Error report downloaded");
    return rows
      .map((row) => `${row.rowNumber},"${row.validationStatus}","${row.messages.join("; ")}"`)
      .join("\n");
  },
};

function createRuleId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function updateConfigItem<T extends { id: string }>(
  collection: T[],
  id: string,
  actorId: string,
  entityType: AuditEntityType,
  input: Partial<T>,
) {
  const item = collection.find((entry) => entry.id === id);
  if (!item) return null;
  const before = { ...item };
  Object.assign(item, input);
  recordAuditLog({
    actorId: adminActor(actorId),
    action: `${entityType}.updated`,
    entityType,
    entityId: id,
    before,
    after: { ...item },
  });
  return item;
}

function archiveConfigItem<T extends { id: string; active?: boolean; enabled?: boolean }>(
  collection: T[],
  id: string,
  actorId: string,
  entityType: AuditEntityType,
) {
  const item = collection.find((entry) => entry.id === id);
  if (!item) return null;
  const before = { ...item };
  if ("active" in item) item.active = false;
  if ("enabled" in item) item.enabled = false;
  recordAuditLog({
    actorId: adminActor(actorId),
    action: `${entityType}.archived`,
    entityType,
    entityId: id,
    before,
    after: { ...item },
  });
  return item;
}

export const configurationService = {
  listTaskTemplates: () => [...taskTemplates],
  createTaskTemplate: (actorId: string) => {
    const template: TaskTemplate = {
      id: createRuleId("task-template"),
      name: "New Daily Operations Template",
      description: "Define checklist, evidence and recurrence before generating tasks.",
      type: "Daily DC Operation",
      recurrence: "Daily",
      ownerTeam: "DC",
      checklist: ["Add checklist item"],
      evidenceRequired: true,
      sharedDailyOperation: true,
      active: true,
    };
    taskTemplates.unshift(template);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "task-template.created",
      entityType: "task-template",
      entityId: template.id,
      after: template,
    });
    return template;
  },
  updateTaskTemplate: (id: string, actorId: string, input: Partial<TaskTemplate>) =>
    updateConfigItem(taskTemplates, id, actorId, "task-template", input),
  archiveTaskTemplate: (id: string, actorId: string) =>
    archiveConfigItem(taskTemplates, id, actorId, "task-template"),

  listIncidentRules: () => [...incidentRules],
  createIncidentRule: (actorId: string) => {
    const rule: IncidentRule = {
      id: createRuleId("incident-rule"),
      category: "Unknown",
      defaultSeverity: "SEV-3",
      slaMinutes: 60,
      assignmentTeam: "Shared",
      recommendedSop: "Select recommended SOP",
      escalationPath: "Shift Lead -> Manager",
      active: true,
    };
    incidentRules.unshift(rule);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "incident-rule.created",
      entityType: "incident-rule",
      entityId: rule.id,
      after: rule,
    });
    return rule;
  },
  updateIncidentRule: (id: string, actorId: string, input: Partial<IncidentRule>) =>
    updateConfigItem(incidentRules, id, actorId, "incident-rule", input),
  archiveIncidentRule: (id: string, actorId: string) =>
    archiveConfigItem(incidentRules, id, actorId, "incident-rule"),

  listProjectTemplates: () => [...projectTemplates],
  createProjectTemplate: (actorId: string) => {
    const template: ProjectTemplate = {
      id: createRuleId("project-template"),
      name: "New Project Template",
      description: "Define reusable phases and governance gate before creating projects.",
      defaultTeam: "Shared",
      phases: ["Initiation", "Execution", "Validation"],
      governanceGate: "Manager review required before closure",
      active: true,
    };
    projectTemplates.unshift(template);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "project-template.created",
      entityType: "project-template",
      entityId: template.id,
      after: template,
    });
    return template;
  },
  updateProjectTemplate: (id: string, actorId: string, input: Partial<ProjectTemplate>) =>
    updateConfigItem(projectTemplates, id, actorId, "project-template", input),
  archiveProjectTemplate: (id: string, actorId: string) =>
    archiveConfigItem(projectTemplates, id, actorId, "project-template"),

  listRosterRules: () => [...rosterRules],
  createRosterRule: (actorId: string) => {
    const rule: RosterRule = {
      id: createRuleId("roster-rule"),
      name: "New Roster Rule",
      description: "Define coverage, mandatory assignment and fairness guidance.",
      pattern: "Three shifts per day with weekly review",
      mandatoryShift: "Any",
      fairnessTarget: "Balance nights, weekends and handover load",
      active: true,
    };
    rosterRules.unshift(rule);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "roster-rule.created",
      entityType: "roster-rule",
      entityId: rule.id,
      after: rule,
    });
    return rule;
  },
  updateRosterRule: (id: string, actorId: string, input: Partial<RosterRule>) =>
    updateConfigItem(rosterRules, id, actorId, "roster-rule", input),
  archiveRosterRule: (id: string, actorId: string) =>
    archiveConfigItem(rosterRules, id, actorId, "roster-rule"),

  listHandoverTemplates: () => [...handoverTemplates],
  createHandoverTemplate: (actorId: string) => {
    const template: HandoverTemplate = {
      id: createRuleId("handover-template"),
      name: "New Handover Template",
      description: "Define required categories and acknowledgement rules.",
      requiredCategories: ["General"],
      requiresAcknowledgement: true,
      criticalRequiresNextAction: true,
      active: true,
    };
    handoverTemplates.unshift(template);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "handover-template.created",
      entityType: "handover-template",
      entityId: template.id,
      after: template,
    });
    return template;
  },
  updateHandoverTemplate: (id: string, actorId: string, input: Partial<HandoverTemplate>) =>
    updateConfigItem(handoverTemplates, id, actorId, "handover-template", input),
  archiveHandoverTemplate: (id: string, actorId: string) =>
    archiveConfigItem(handoverTemplates, id, actorId, "handover-template"),

  listSopSettings: () => [...sopSettings],
  createSopSetting: (actorId: string) => {
    const setting: SopSetting = {
      id: createRuleId("sop-setting"),
      name: "New SOP Setting",
      category: "Runbook",
      approvalWorkflow: "Author -> Reviewer -> Approver",
      visibilityRule: "Visible after approval",
      linkableTo: ["Tasks", "Incidents"],
      active: true,
    };
    sopSettings.unshift(setting);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "sop-setting.created",
      entityType: "sop-setting",
      entityId: setting.id,
      after: setting,
    });
    return setting;
  },
  updateSopSetting: (id: string, actorId: string, input: Partial<SopSetting>) =>
    updateConfigItem(sopSettings, id, actorId, "sop-setting", input),
  archiveSopSetting: (id: string, actorId: string) =>
    archiveConfigItem(sopSettings, id, actorId, "sop-setting"),

  listDashboardWidgets: () => [...dashboardWidgetSettings],
  createDashboardWidget: (actorId: string) => {
    const widget: DashboardWidgetSetting = {
      id: createRuleId("dashboard-widget"),
      role: "manager",
      widget: "New Widget",
      description: "Define widget purpose and who should see it.",
      enabled: true,
      governanceSignal: "Role Restricted",
    };
    dashboardWidgetSettings.unshift(widget);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "dashboard-widget.created",
      entityType: "dashboard-widget",
      entityId: widget.id,
      after: widget,
    });
    return widget;
  },
  updateDashboardWidget: (id: string, actorId: string, input: Partial<DashboardWidgetSetting>) =>
    updateConfigItem(dashboardWidgetSettings, id, actorId, "dashboard-widget", input),
  archiveDashboardWidget: (id: string, actorId: string) =>
    archiveConfigItem(dashboardWidgetSettings, id, actorId, "dashboard-widget"),

  listSlaPolicies: () => [...slaEscalationPolicies],
  createSlaPolicy: (actorId: string) => {
    const policy: SlaEscalationPolicy = {
      id: createRuleId("sla-policy"),
      name: "New SLA Policy",
      appliesTo: "Incidents",
      thresholdMinutes: 60,
      escalationOwner: "Shared",
      active: true,
    };
    slaEscalationPolicies.unshift(policy);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "sla-policy.created",
      entityType: "sla-policy",
      entityId: policy.id,
      after: policy,
    });
    return policy;
  },
  updateSlaPolicy: (id: string, actorId: string, input: Partial<SlaEscalationPolicy>) =>
    updateConfigItem(slaEscalationPolicies, id, actorId, "sla-policy", input),
  archiveSlaPolicy: (id: string, actorId: string) =>
    archiveConfigItem(slaEscalationPolicies, id, actorId, "sla-policy"),
};

export const taskService = {
  list: () => {
    hydrateMockTasks();
    return [...tasks];
  },
  create: (
    actorId: string,
    input: {
      title: string;
      description: string;
      details?: string;
      acceptanceCriteria?: string;
      type: TaskType;
      category: string;
      priority: Priority;
      assignee: string | null;
      dueDate: string;
      relatedIncident?: string | null;
      relatedProject?: string | null;
      relatedHandover?: string | null;
      notes?: string;
    },
  ) => {
    if (
      !input.title.trim() ||
      !input.description.trim() ||
      !input.assignee ||
      !input.priority ||
      !input.dueDate
    ) {
      return null;
    }
    const task: Task = {
      id: nextNumericId(
        "TASK-",
        tasks.map((item) => item.id),
      ),
      title: input.title.trim(),
      description: input.description.trim(),
      details: input.details?.trim() || input.description.trim(),
      acceptanceCriteria:
        input.acceptanceCriteria?.trim() ||
        "Task completed according to the assigned operational standard.",
      type: input.type,
      category: input.category,
      priority: input.priority,
      impact:
        input.priority === "Critical" ? "High" : input.priority === "High" ? "High" : "Medium",
      status: "New",
      assignee: input.assignee,
      dueDate: input.dueDate,
      sla: "On Track",
      comments: 0,
      evidence: 0,
      audit: "Pending",
      relatedIncident: input.relatedIncident ?? null,
      relatedProject: input.relatedProject ?? null,
      relatedHandover: input.relatedHandover ?? null,
      notes: input.notes?.trim() || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.unshift(task);
    writeMockStorage("ops-command-mock-tasks", tasks);
    recordAuditLog({
      actorId,
      action: "task.created",
      entityType: "task",
      entityId: task.id,
      after: task,
    });
    return task;
  },
  update: (taskId: string, actorId: string, input: Partial<Task>) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return null;
    Object.assign(task, input, { updatedAt: new Date().toISOString() });
    writeMockStorage("ops-command-mock-tasks", tasks);
    recordAuditLog({
      actorId,
      action: "task.updated",
      entityType: "task",
      entityId: taskId,
      after: task,
    });
    return task;
  },
  createFromTemplate: (actorId: string, templateId: string) => {
    const template = taskTemplates.find((item) => item.id === templateId && item.active);
    if (!template) return null;
    const task = {
      id: nextNumericId(
        "TASK-",
        tasks.map((item) => item.id),
      ),
      title: template.name,
      description: `${template.description}\n\nChecklist:\n${template.checklist
        .map((item) => `- ${item}`)
        .join("\n")}`,
      type: template.type,
      category: template.ownerTeam === "NOC" ? "Network" : "DC Operations",
      priority: "Medium" as const,
      impact: "Medium" as const,
      status: "New" as const,
      assignee: template.sharedDailyOperation ? "shared" : null,
      dueDate: new Date().toISOString().slice(0, 10),
      sla: "On Track" as const,
      comments: 0,
      evidence: template.evidenceRequired ? 1 : 0,
      audit: "Pending" as const,
    };
    tasks.unshift(task);
    writeMockStorage("ops-command-mock-tasks", tasks);
    recordAuditLog({
      actorId,
      action: "task.generated-from-template",
      entityType: "task",
      entityId: task.id,
      after: { task, templateId },
    });
    return task;
  },
  updateStatus: (taskId: string, status: TaskStatus, actorId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return null;
    const before = { status: task.status };
    task.status = status;
    task.updatedAt = new Date().toISOString();
    writeMockStorage("ops-command-mock-tasks", tasks);
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
    task.updatedAt = new Date().toISOString();
    writeMockStorage("ops-command-mock-tasks", tasks);
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
    input: Pick<
      Incident,
      | "title"
      | "description"
      | "source"
      | "category"
      | "severity"
      | "shift"
      | "incidentAt"
      | "impactDescription"
      | "immediateActionTaken"
      | "currentStatus"
      | "relatedTask"
      | "relatedHandover"
      | "notes"
    >,
  ) => {
    const rule = incidentRules.find((item) => item.category === input.category && item.active);
    const incident: Incident = {
      id: nextNumericId(
        "INC-",
        incidents.map((incident) => incident.id),
      ),
      title: input.title.trim(),
      description: input.description.trim(),
      source: input.source ?? "Manual",
      sourceRef: rule ? `Rule: ${rule.id}` : "Manual Entry",
      category: input.category,
      subcategory: rule?.recommendedSop ?? "General",
      severity: input.severity ?? rule?.defaultSeverity ?? "SEV-3",
      status: "Unassigned",
      assignee: null,
      sla: "On Track",
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      shift: input.shift ?? "Morning",
      incidentAt: input.incidentAt ?? new Date().toISOString(),
      impactDescription: input.impactDescription?.trim() ?? "",
      immediateActionTaken: input.immediateActionTaken?.trim() ?? "",
      currentStatus: input.currentStatus ?? "Open",
      relatedTask: input.relatedTask ?? null,
      relatedHandover: input.relatedHandover ?? null,
      notes: input.notes?.trim() ?? "",
    };
    incidents.unshift(incident);
    writeMockStorage("ops-command-mock-incidents", incidents);
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
  createFromTemplate: (actorId: string, templateId: string) => {
    const template = projectTemplates.find((item) => item.id === templateId && item.active);
    if (!template) return null;
    const now = new Date();
    const target = new Date(now);
    target.setDate(target.getDate() + 30);
    const project = {
      id: nextNumericId(
        "PRJ-",
        projects.map((item) => item.id),
      ),
      name: template.name,
      description: template.description,
      type: "Operational Improvement" as const,
      owner: actorId,
      sponsor: actorId,
      team: template.defaultTeam,
      priority: "Medium" as const,
      impact: "Medium" as const,
      status: "Planning" as const,
      startDate: now.toISOString().slice(0, 10),
      targetDate: target.toISOString().slice(0, 10),
      completion: 0,
      risk: "Low" as const,
      blockers: [],
    };
    projects.unshift(project);
    template.phases.forEach((phase, index) => {
      projectTasks.push({
        id: nextNumericId(
          "PT-",
          projectTasks.map((task) => task.id),
        ),
        projectId: project.id,
        title: phase,
        description: `${phase} - ${template.governanceGate}`,
        assignee: actorId,
        status: index === 0 ? "To Do" : "To Do",
        priority: "Medium",
        dueDate: project.targetDate,
        completion: 0,
        comments: 0,
        evidence: 0,
      });
    });
    recordAuditLog({
      actorId,
      action: "project.generated-from-template",
      entityType: "project",
      entityId: project.id,
      after: { project, templateId },
    });
    return project;
  },
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
      latestUpdate: "Task created and awaiting assignment.",
      lastUpdatedBy: actorId,
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
    task.lastUpdatedBy = actorId;
    task.latestUpdate = `${userById(actorId)} updated progress to ${nextCompletion}% and set status to ${task.status}.`;
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
        latestUpdate: task.latestUpdate,
      },
    });
    return task;
  },
  updateTaskAssignee: (taskId: string, assigneeId: string | null, actorId: string) => {
    const task = projectTasks.find((item) => item.id === taskId);
    if (!task) return null;
    const before = { assignee: task.assignee };
    task.assignee = assigneeId;
    task.lastUpdatedBy = actorId;
    task.latestUpdate = `${userById(actorId)} assigned this task to ${assigneeId ? userById(assigneeId) : "unassigned"}.`;
    recordAuditLog({
      actorId,
      action: "project-task.assign",
      entityType: "project-task",
      entityId: task.id,
      before,
      after: { assignee: assigneeId, latestUpdate: task.latestUpdate },
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
    const activeRosterRules = rosterRules.filter((rule) => rule.active);
    let mandatoryAssignmentsApplied = 0;

    dates.forEach((date) => {
      input.shiftTypes.forEach((type) => {
        const existing = findShift(date, type);
        if (existing && !input.overwriteExisting) {
          skipped += 1;
          return;
        }

        const engineers = Array.from(new Set(input.engineers));
        activeRosterRules.forEach((rule) => {
          const appliesToShift = rule.mandatoryShift === "Any" || rule.mandatoryShift === type;
          if (
            rule.mandatoryEngineer &&
            appliesToShift &&
            !engineers.includes(rule.mandatoryEngineer)
          ) {
            engineers.push(rule.mandatoryEngineer);
            mandatoryAssignmentsApplied += 1;
          }
        });
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
      mandatoryAssignmentsApplied,
      fairnessSummary:
        activeRosterRules.find((rule) => rule.fairnessTarget)?.fairnessTarget ??
        "Review night, weekend and handover load manually.",
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
      shiftLeadApproval: "-",
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
    const actor = users.find((user) => user.id === actorId);
    const before = {
      status: request.status,
      shiftLeadApproval: request.shiftLeadApproval,
      managerApproval: request.managerApproval,
    };

    if (actor?.role === "shift-lead" || actor?.role === "admin") {
      request.shiftLeadApproval = status === "Pending" ? "-" : `${status} by ${userById(actorId)}`;
    }

    if (actor?.role === "manager" || actor?.role === "admin") {
      request.managerApproval = status === "Pending" ? "-" : `${status} by ${userById(actorId)}`;
    }

    if (
      request.shiftLeadApproval.includes("Approved") &&
      request.managerApproval.includes("Approved")
    ) {
      request.status = "Approved";
    } else if (
      request.shiftLeadApproval.includes("Rejected") ||
      request.managerApproval.includes("Rejected")
    ) {
      request.status = "Rejected";
    } else {
      request.status = "Pending";
    }

    if (request.status === "Approved") applyApprovedShiftRequest(request, actorId);

    recordAuditLog({
      actorId,
      action:
        request.status === "Approved"
          ? "shift-request.approved"
          : request.status === "Rejected"
            ? "shift-request.rejected"
            : "shift-request.status.update",
      entityType: "shift-request",
      entityId: requestId,
      before,
      after: {
        status: request.status,
        shiftLeadApproval: request.shiftLeadApproval,
        managerApproval: request.managerApproval,
      },
    });

    return request;
  },
};

export const handoverService = {
  list: () => [...handoverPoints],
  listComments: (handoverId: string) =>
    [...handoverComments]
      .filter((comment) => comment.handoverId === handoverId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  addComment: (
    actorId: string,
    handoverId: string,
    input: Pick<HandoverComment, "commentText" | "handoverPointId" | "visibility">,
  ) => {
    const actor = users.find((user) => user.id === actorId);
    const comment: HandoverComment = {
      id: `HC-${handoverComments.length + 1}`,
      handoverId,
      handoverPointId: input.handoverPointId,
      commentText: input.commentText.trim(),
      createdBy: actorId,
      createdAt: new Date().toISOString(),
      role: actor?.role ?? "engineer",
      visibility: input.visibility ?? "Team",
    };
    handoverComments.unshift(comment);
    recordAuditLog({
      actorId: adminActor(actorId),
      action: "handover.comment.added",
      entityType: "handover",
      entityId: handoverId,
      after: { commentId: comment.id, commentText: comment.commentText, createdBy: actorId },
    });
    return comment;
  },
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
