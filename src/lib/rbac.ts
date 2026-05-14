import type { Role, ProjectTask, User } from "./mock-data";

const ROUTE_ROLES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/dashboard", roles: ["manager", "executive", "admin"] },
  { prefix: "/my-work", roles: ["engineer"] },
  { prefix: "/tasks", roles: ["engineer", "manager", "admin"] },
  { prefix: "/incidents", roles: ["engineer", "manager", "executive", "admin"] },
  { prefix: "/projects", roles: ["engineer", "manager", "executive", "admin"] },
  { prefix: "/shifts", roles: ["engineer", "manager", "admin"] },
  { prefix: "/shift-requests", roles: ["engineer", "manager", "admin"] },
  { prefix: "/handover", roles: ["engineer", "manager", "admin"] },
  { prefix: "/sop", roles: ["engineer", "manager", "executive", "admin"] },
  { prefix: "/productivity", roles: ["manager", "executive", "admin"] },
  { prefix: "/reports", roles: ["manager", "executive", "admin"] },
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
  if (user.role !== "engineer") return false;
  return (
    task.assignee === user.id || task.assignee === "shared" || task.type === "Daily DC Operation"
  );
}

export function canManageProjects(user: User | null) {
  return !!user && ["manager", "admin"].includes(user.role);
}

export function canEditProjectTask(user: User | null, task: Pick<ProjectTask, "assignee"> | null) {
  if (!user || !task) return false;
  if (["manager", "admin"].includes(user.role)) return true;
  return user.role === "engineer" && task.assignee === user.id;
}

export function canSubmitHandover(user: User | null) {
  return !!user && user.role === "engineer";
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
  return !!user && user.role === "engineer";
}

export function canAuditHandover(user: User | null) {
  return !!user && ["manager", "admin"].includes(user.role);
}

export function canManageSops(user: User | null) {
  return !!user && ["manager", "admin"].includes(user.role);
}
