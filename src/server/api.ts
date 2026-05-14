import {
  authenticateMockUser,
  getMockUserById,
  handoverService,
  incidentService,
  projectService,
  shiftRequestService,
  taskService,
  userService,
} from "@/lib/services";
import { recordAuditLog } from "@/lib/audit-log";
import {
  canAuditHandover,
  canCreateIncidents,
  canEditProjectTask,
  canEditTask,
  canManageProjects,
  canManageShiftRequests,
  canSubmitHandover,
  canSubmitShiftRequests,
  canWorkIncidents,
} from "@/lib/rbac";
import type {
  HandoverPoint,
  Incident,
  IncidentStatus,
  ShiftRequest,
  TaskStatus,
  User,
} from "@/lib/mock-data";

type ApiHandler = (
  request: Request,
  params: Record<string, string>,
) => Promise<Response> | Response;

interface RouteDefinition {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: ApiHandler;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

function error(message: string, status = 400) {
  return json({ error: message }, { status });
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

function requireUser(actorId: string | undefined) {
  const user = getMockUserById(actorId);
  if (!user) throw error("Valid actorId is required", 401);
  return user;
}

function requireAdmin(actorId: string | undefined) {
  const user = requireUser(actorId);
  if (user.role !== "admin") throw error("Only admins can manage users", 403);
  return user;
}

const routes: RouteDefinition[] = [
  {
    method: "GET",
    pattern: /^\/api\/health$/,
    keys: [],
    handler: () =>
      json({
        ok: true,
        service: "control-zone-pro-api",
        mode: "server-backed-demo",
        checkedAt: new Date().toISOString(),
      }),
  },
  {
    method: "POST",
    pattern: /^\/api\/auth\/login$/,
    keys: [],
    handler: async (request) => {
      const body = await readJson<{ username?: string; password?: string }>(request);
      const user = authenticateMockUser(body.username ?? "", body.password ?? "");
      if (!user) return error("Invalid credentials", 401);
      recordAuditLog({
        actorId: user.id,
        action: "auth.login",
        entityType: "auth",
        entityId: user.id,
      });
      return json({ user });
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/auth\/users\/([^/]+)$/,
    keys: ["userId"],
    handler: (_request, params) => {
      const user = getMockUserById(params.userId);
      if (!user) return error("User not found", 404);
      return json({ user });
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/auth\/logout$/,
    keys: [],
    handler: async (request) => {
      const body = await readJson<{ actorId?: string }>(request);
      const user = requireUser(body.actorId);
      recordAuditLog({
        actorId: user.id,
        action: "auth.logout",
        entityType: "auth",
        entityId: user.id,
      });
      return json({ ok: true });
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/users$/,
    keys: [],
    handler: () => json({ rows: userService.list() }),
  },
  {
    method: "POST",
    pattern: /^\/api\/users$/,
    keys: [],
    handler: async (request) => {
      const body = await readJson<{
        actorId?: string;
        user?: Pick<User, "name" | "username" | "role"> & { team?: User["team"] };
      }>(request);
      const actor = requireAdmin(body.actorId);
      if (!body.user?.name?.trim()) return error("Name is required");
      if (!body.user.username?.trim()) return error("Username is required");

      const created = userService.create(actor.id, body.user);
      if (!created) return error("Username is already used");
      return json({ user: created, rows: userService.list() }, { status: 201 });
    },
  },
  {
    method: "PATCH",
    pattern: /^\/api\/users\/([^/]+)$/,
    keys: ["userId"],
    handler: async (request, params) => {
      const body = await readJson<{
        actorId?: string;
        user?: Partial<Pick<User, "name" | "username" | "role" | "team">>;
      }>(request);
      const actor = requireAdmin(body.actorId);
      if (!body.user) return error("User update is required");

      const row = userService.update(params.userId, actor.id, body.user);
      if (!row) return error("User not found or username already used", 404);
      return json({ user: row, rows: userService.list() });
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/handover$/,
    keys: [],
    handler: () => json({ rows: handoverService.list() }),
  },
  {
    method: "POST",
    pattern: /^\/api\/handover\/bulk$/,
    keys: [],
    handler: async (request) => {
      const body = await readJson<{
        actorId?: string;
        rows?: Array<Parameters<typeof handoverService.create>[1]>;
      }>(request);
      const user = requireUser(body.actorId);
      if (!canSubmitHandover(user)) return error("You cannot submit handover rows", 403);
      if (!body.rows?.length) return error("At least one handover row is required");

      const created = body.rows.map((row) => handoverService.create(user.id, row));
      return json({ rows: handoverService.list(), created }, { status: 201 });
    },
  },
  {
    method: "PATCH",
    pattern: /^\/api\/handover\/([^/]+)\/audit$/,
    keys: ["handoverId"],
    handler: async (request, params) => {
      const body = await readJson<{ actorId?: string; audit?: HandoverPoint["audit"] }>(request);
      const user = requireUser(body.actorId);
      if (!canAuditHandover(user)) return error("You cannot audit handover rows", 403);
      if (!body.audit) return error("Audit status is required");

      const row = handoverService.updateAudit(params.handoverId, body.audit, user.id);
      if (!row) return error("Handover row not found", 404);
      return json({ row, rows: handoverService.list() });
    },
  },
  {
    method: "PATCH",
    pattern: /^\/api\/handover\/([^/]+)\/acknowledge$/,
    keys: ["handoverId"],
    handler: async (request, params) => {
      const body = await readJson<{ actorId?: string }>(request);
      const user = requireUser(body.actorId);
      if (!canAuditHandover(user)) return error("You cannot acknowledge handover rows", 403);

      const row = handoverService.acknowledge(params.handoverId, user.id);
      if (!row) return error("Handover row not found", 404);
      return json({ row, rows: handoverService.list() });
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/shift-requests$/,
    keys: [],
    handler: () => json({ rows: shiftRequestService.list() }),
  },
  {
    method: "POST",
    pattern: /^\/api\/shift-requests$/,
    keys: [],
    handler: async (request) => {
      const body = await readJson<{
        actorId?: string;
        request?: Pick<
          ShiftRequest,
          "type" | "requestedDate" | "currentShift" | "requestedShift" | "reason"
        >;
      }>(request);
      const user = requireUser(body.actorId);
      if (!canSubmitShiftRequests(user)) return error("You cannot submit shift requests", 403);
      if (!body.request?.reason?.trim()) return error("Reason is required");

      const created = shiftRequestService.create(user.id, body.request);
      return json({ request: created, rows: shiftRequestService.list() }, { status: 201 });
    },
  },
  {
    method: "PATCH",
    pattern: /^\/api\/shift-requests\/([^/]+)\/status$/,
    keys: ["requestId"],
    handler: async (request, params) => {
      const body = await readJson<{ actorId?: string; status?: ShiftRequest["status"] }>(request);
      const user = requireUser(body.actorId);
      if (!canManageShiftRequests(user)) return error("You cannot manage shift requests", 403);
      if (!body.status) return error("Status is required");

      const row = shiftRequestService.updateStatus(params.requestId, body.status, user.id);
      if (!row) return error("Shift request not found", 404);
      return json({ request: row, rows: shiftRequestService.list() });
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/tasks$/,
    keys: [],
    handler: () => json({ rows: taskService.list() }),
  },
  {
    method: "POST",
    pattern: /^\/api\/tasks$/,
    keys: [],
    handler: async (request) => {
      const body = await readJson<{ actorId?: string }>(request);
      const user = requireUser(body.actorId);
      if (!["manager", "admin"].includes(user.role)) {
        return error("Only managers and admins can create tasks", 403);
      }

      const task = taskService.create(user.id);
      return json({ task, rows: taskService.list() }, { status: 201 });
    },
  },
  {
    method: "PATCH",
    pattern: /^\/api\/tasks\/([^/]+)\/status$/,
    keys: ["taskId"],
    handler: async (request, params) => {
      const body = await readJson<{ actorId?: string; status?: TaskStatus }>(request);
      const user = requireUser(body.actorId);
      const task = taskService.get(params.taskId);
      if (!task) return error("Task not found", 404);
      if (!canEditTask(user, task)) return error("You cannot update this task", 403);
      if (!body.status) return error("Status is required");

      const row = taskService.updateStatus(params.taskId, body.status, user.id);
      return json({ task: row, rows: taskService.list() });
    },
  },
  {
    method: "PATCH",
    pattern: /^\/api\/tasks\/([^/]+)\/assignee$/,
    keys: ["taskId"],
    handler: async (request, params) => {
      const body = await readJson<{ actorId?: string; assigneeId?: string | null }>(request);
      const user = requireUser(body.actorId);
      const task = taskService.get(params.taskId);
      if (!task) return error("Task not found", 404);
      if (!["manager", "admin"].includes(user.role)) {
        return error("Only managers and admins can assign tasks", 403);
      }

      const row = taskService.assignTo(params.taskId, body.assigneeId ?? null, user.id);
      return json({ task: row, rows: taskService.list() });
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/incidents$/,
    keys: [],
    handler: () => json({ rows: incidentService.list() }),
  },
  {
    method: "POST",
    pattern: /^\/api\/incidents$/,
    keys: [],
    handler: async (request) => {
      const body = await readJson<{
        actorId?: string;
        incident?: Pick<Incident, "title" | "description" | "source" | "category">;
      }>(request);
      const user = requireUser(body.actorId);
      if (!canCreateIncidents(user)) return error("You cannot create incidents", 403);
      if (!body.incident?.title?.trim()) return error("Incident title is required");

      const incident = incidentService.create(user.id, body.incident);
      return json({ incident, rows: incidentService.list() }, { status: 201 });
    },
  },
  {
    method: "PATCH",
    pattern: /^\/api\/incidents\/([^/]+)\/assignee$/,
    keys: ["incidentId"],
    handler: async (request, params) => {
      const body = await readJson<{ actorId?: string; assigneeId?: string }>(request);
      const user = requireUser(body.actorId);
      if (!canWorkIncidents(user)) return error("You cannot assign incidents", 403);
      const assigneeId = body.assigneeId ?? user.id;

      const row = incidentService.assignTo(params.incidentId, assigneeId, user.id);
      if (!row) return error("Incident not found", 404);
      return json({ incident: row, rows: incidentService.list() });
    },
  },
  {
    method: "PATCH",
    pattern: /^\/api\/incidents\/([^/]+)\/status$/,
    keys: ["incidentId"],
    handler: async (request, params) => {
      const body = await readJson<{ actorId?: string; status?: IncidentStatus }>(request);
      const user = requireUser(body.actorId);
      if (!canWorkIncidents(user)) return error("You cannot update incidents", 403);
      if (!body.status) return error("Status is required");

      const row = incidentService.updateStatus(params.incidentId, body.status, user.id);
      if (!row) return error("Incident not found", 404);
      return json({ incident: row, rows: incidentService.list() });
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/incidents\/([^/]+)\/escalate$/,
    keys: ["incidentId"],
    handler: async (request, params) => {
      const body = await readJson<{ actorId?: string }>(request);
      const user = requireUser(body.actorId);
      if (!canWorkIncidents(user)) return error("You cannot escalate incidents", 403);

      const row = incidentService.escalate(params.incidentId, user.id);
      if (!row) return error("Incident not found", 404);
      return json({ incident: row, rows: incidentService.list() });
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/projects$/,
    keys: [],
    handler: () => json({ rows: projectService.list() }),
  },
  {
    method: "GET",
    pattern: /^\/api\/projects\/([^/]+)$/,
    keys: ["projectId"],
    handler: (_request, params) => {
      const project = projectService.get(params.projectId);
      if (!project) return error("Project not found", 404);
      return json({ project, tasks: projectService.listTasks(params.projectId) });
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/project-tasks$/,
    keys: [],
    handler: (request) => {
      const url = new URL(request.url);
      const projectId = url.searchParams.get("projectId") ?? undefined;
      return json({ rows: projectService.listTasks(projectId) });
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/projects\/([^/]+)\/tasks$/,
    keys: ["projectId"],
    handler: async (request, params) => {
      const body = await readJson<{ actorId?: string }>(request);
      const user = requireUser(body.actorId);
      if (!canManageProjects(user)) return error("You cannot add project tasks", 403);

      const task = projectService.createTask(params.projectId, user.id);
      if (!task) return error("Project not found", 404);
      return json(
        {
          task,
          project: projectService.get(params.projectId),
          rows: projectService.listTasks(params.projectId),
        },
        { status: 201 },
      );
    },
  },
  {
    method: "PATCH",
    pattern: /^\/api\/project-tasks\/([^/]+)\/progress$/,
    keys: ["taskId"],
    handler: async (request, params) => {
      const body = await readJson<{ actorId?: string; completion?: number }>(request);
      const user = requireUser(body.actorId);
      const task = projectService.listTasks().find((item) => item.id === params.taskId);
      if (!task) return error("Project task not found", 404);
      if (!canEditProjectTask(user, task)) return error("You cannot update this project task", 403);
      if (typeof body.completion !== "number") return error("Completion is required");

      const row = projectService.updateTaskProgress(params.taskId, body.completion, user.id);
      if (!row) return error("Project task not found", 404);
      return json({
        task: row,
        project: projectService.get(row.projectId),
        rows: projectService.listTasks(row.projectId),
      });
    },
  },
];

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return null;

  const route = routes.find((candidate) => {
    return candidate.method === request.method && candidate.pattern.test(url.pathname);
  });

  if (!route) return error("API route not found", 404);

  const match = url.pathname.match(route.pattern);
  const params = Object.fromEntries(
    route.keys.map((key, index) => [key, match?.[index + 1] ?? ""]),
  );

  try {
    return await route.handler(request, params);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return error("Unexpected API error", 500);
  }
}
