import type { ImportType, ProjectTask, Role, User } from "./data";

const ROUTE_ROLES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/dashboard", roles: ["manager", "executive", "admin"] },
  { prefix: "/my-work", roles: ["engineer", "shift-lead"] },
  { prefix: "/tasks", roles: ["engineer", "shift-lead", "manager", "admin"] },
  { prefix: "/incidents", roles: ["engineer", "shift-lead", "manager", "executive", "admin"] },
  { prefix: "/projects", roles: ["engineer", "shift-lead", "manager", "executive", "admin"] },
  { prefix: "/shifts", roles: ["engineer", "shift-lead", "manager", "executive", "admin"] },
  { prefix: "/shift-requests", roles: ["engineer", "shift-lead", "manager", "admin"] },
  { prefix: "/handover", roles: ["engineer", "shift-lead", "manager", "admin"] },
  { prefix: "/sop", roles: ["engineer", "shift-lead", "manager", "executive", "admin"] },
  { prefix: "/import-center", roles: ["shift-lead", "manager", "executive", "admin"] },
  { prefix: "/productivity", roles: ["manager", "executive", "admin"] },
  { prefix: "/reports", roles: ["shift-lead", "manager", "executive", "admin"] },
  { prefix: "/admin", roles: ["admin"] },
];

export function rolesForPath(pathname: string): Role[] | null {
  if (pathname === "/" || pathname === "/login") return null;
  return (
    ROUTE_ROLES.find(
      (route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`),
    )?.roles ?? null
  );
}

export function canAccessPath(user: User | null, pathname: string) {
  const roles = rolesForPath(pathname);
  if (!roles) return true;
  return !!user && roles.includes(user.role);
}

export function canManageTasks(user: User | null) {
  return !!user && ["engineer", "manager", "admin"].includes(user.role);
}

export function canEditTask(
  user: User | null,
  task: { assignee?: string | null; type?: string } | null,
) {
  if (!user || !task) return false;
  if (["manager", "admin"].includes(user.role)) return true;
  if (!["engineer", "shift-lead"].includes(user.role)) return false;
  return task.assignee === user.id || task.assignee === "shared";
}

export function canManageProjects(user: User | null) {
  return !!user && ["manager", "admin"].includes(user.role);
}

export function canEditProjectTask(user: User | null, task: Pick<ProjectTask, "assignee"> | null) {
  if (!user || !task) return false;
  if (["manager", "admin"].includes(user.role)) return true;
  return ["engineer", "shift-lead"].includes(user.role) && task.assignee === user.id;
}

export function canSubmitHandover(user: User | null) {
  return !!user && ["engineer", "admin"].includes(user.role);
}

export function canCommentOnHandover(user: User | null) {
  return !!user && ["engineer", "shift-lead", "manager", "admin"].includes(user.role);
}

export function canCreateIncidents(user: User | null) {
  return !!user && ["engineer", "manager", "admin"].includes(user.role);
}

export function canWorkIncidents(user: User | null) {
  return !!user && ["engineer", "manager", "admin"].includes(user.role);
}

export function canManageShiftRequests(user: User | null) {
  return !!user && ["manager", "admin"].includes(user.role);
}

export function canSubmitShiftRequests(user: User | null) {
  return !!user && ["engineer", "shift-lead"].includes(user.role);
}

export function canManageRoster(user: User | null) {
  return !!user && ["manager", "admin"].includes(user.role);
}

export function canAuditHandover(user: User | null) {
  return !!user && ["shift-lead", "manager", "admin"].includes(user.role);
}

export function canManageSops(user: User | null) {
  return !!user && ["manager", "admin"].includes(user.role);
}

export function canViewImportCenter(user: User | null) {
  return !!user && ["shift-lead", "manager", "executive", "admin"].includes(user.role);
}

export function canRunImports(user: User | null) {
  return !!user && ["shift-lead", "manager", "admin"].includes(user.role);
}

export function canImportType(user: User | null, type: ImportType) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "manager") {
    return [
      "Tasks",
      "Incidents",
      "Projects",
      "Project Tasks/Subtasks",
      "Shift Roster",
      "Handover Points",
    ].includes(type);
  }
  if (user.role === "shift-lead") {
    return ["Tasks", "Incidents", "Shift Roster", "Handover Points"].includes(type);
  }
  return false;
}
