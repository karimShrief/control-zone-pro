import type {
  HandoverPoint,
  Incident,
  IncidentStatus,
  Project,
  ProjectTask,
  ShiftRequest,
  Task,
  TaskStatus,
  User,
} from "./mock-data";

type HandoverCreateInput = Parameters<typeof import("./services").handoverService.create>[1];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  const payload = (await response.json()) as T | { error?: string };
  if (!response.ok) {
    throw new Error("error" in payload && payload.error ? payload.error : "Backend request failed");
  }

  return payload as T;
}

export const backendClient = {
  health: () =>
    api<{ ok: boolean; service: string; mode: string; checkedAt: string }>("/api/health"),

  login: (username: string, password: string) =>
    api<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getUser: (userId: string) => api<{ user: User }>(`/api/auth/users/${userId}`),

  logout: (actorId: string) =>
    api<{ ok: true }>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ actorId }),
    }),

  listUsers: () => api<{ rows: User[] }>("/api/users"),

  createUser: (
    actorId: string,
    user: Pick<User, "name" | "username" | "role"> & { team?: User["team"] },
  ) =>
    api<{ user: User; rows: User[] }>("/api/users", {
      method: "POST",
      body: JSON.stringify({ actorId, user }),
    }),

  updateUser: (
    actorId: string,
    userId: string,
    user: Partial<Pick<User, "name" | "username" | "role" | "team">>,
  ) =>
    api<{ user: User; rows: User[] }>(`/api/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ actorId, user }),
    }),

  listHandover: () => api<{ rows: HandoverPoint[] }>("/api/handover"),

  createHandoverRows: (actorId: string, rows: HandoverCreateInput[]) =>
    api<{ rows: HandoverPoint[]; created: HandoverPoint[] }>("/api/handover/bulk", {
      method: "POST",
      body: JSON.stringify({ actorId, rows }),
    }),

  updateHandoverAudit: (actorId: string, handoverId: string, audit: HandoverPoint["audit"]) =>
    api<{ row: HandoverPoint; rows: HandoverPoint[] }>(`/api/handover/${handoverId}/audit`, {
      method: "PATCH",
      body: JSON.stringify({ actorId, audit }),
    }),

  acknowledgeHandover: (actorId: string, handoverId: string) =>
    api<{ row: HandoverPoint; rows: HandoverPoint[] }>(`/api/handover/${handoverId}/acknowledge`, {
      method: "PATCH",
      body: JSON.stringify({ actorId }),
    }),

  listShiftRequests: () => api<{ rows: ShiftRequest[] }>("/api/shift-requests"),

  createShiftRequest: (
    actorId: string,
    request: Pick<
      ShiftRequest,
      "type" | "requestedDate" | "currentShift" | "requestedShift" | "reason"
    >,
  ) =>
    api<{ request: ShiftRequest; rows: ShiftRequest[] }>("/api/shift-requests", {
      method: "POST",
      body: JSON.stringify({ actorId, request }),
    }),

  updateShiftRequestStatus: (actorId: string, requestId: string, status: ShiftRequest["status"]) =>
    api<{ request: ShiftRequest; rows: ShiftRequest[] }>(
      `/api/shift-requests/${requestId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ actorId, status }),
      },
    ),

  listTasks: () => api<{ rows: Task[] }>("/api/tasks"),

  createTask: (actorId: string) =>
    api<{ task: Task; rows: Task[] }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ actorId }),
    }),

  updateTaskStatus: (actorId: string, taskId: string, status: TaskStatus) =>
    api<{ task: Task; rows: Task[] }>(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ actorId, status }),
    }),

  assignTask: (actorId: string, taskId: string, assigneeId: string | null) =>
    api<{ task: Task; rows: Task[] }>(`/api/tasks/${taskId}/assignee`, {
      method: "PATCH",
      body: JSON.stringify({ actorId, assigneeId }),
    }),

  listIncidents: () => api<{ rows: Incident[] }>("/api/incidents"),

  createIncident: (
    actorId: string,
    incident: Pick<Incident, "title" | "description" | "source" | "category">,
  ) =>
    api<{ incident: Incident; rows: Incident[] }>("/api/incidents", {
      method: "POST",
      body: JSON.stringify({ actorId, incident }),
    }),

  assignIncident: (actorId: string, incidentId: string, assigneeId?: string) =>
    api<{ incident: Incident; rows: Incident[] }>(`/api/incidents/${incidentId}/assignee`, {
      method: "PATCH",
      body: JSON.stringify({ actorId, assigneeId }),
    }),

  updateIncidentStatus: (actorId: string, incidentId: string, status: IncidentStatus) =>
    api<{ incident: Incident; rows: Incident[] }>(`/api/incidents/${incidentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ actorId, status }),
    }),

  escalateIncident: (actorId: string, incidentId: string) =>
    api<{ incident: Incident; rows: Incident[] }>(`/api/incidents/${incidentId}/escalate`, {
      method: "POST",
      body: JSON.stringify({ actorId }),
    }),

  listProjects: () => api<{ rows: Project[] }>("/api/projects"),

  getProject: (projectId: string) =>
    api<{ project: Project; tasks: ProjectTask[] }>(`/api/projects/${projectId}`),

  listProjectTasks: (projectId?: string) =>
    api<{ rows: ProjectTask[] }>(
      projectId
        ? `/api/project-tasks?projectId=${encodeURIComponent(projectId)}`
        : "/api/project-tasks",
    ),

  createProjectTask: (actorId: string, projectId: string) =>
    api<{ task: ProjectTask; project: Project | null; rows: ProjectTask[] }>(
      `/api/projects/${projectId}/tasks`,
      {
        method: "POST",
        body: JSON.stringify({ actorId }),
      },
    ),

  updateProjectTaskProgress: (actorId: string, taskId: string, completion: number) =>
    api<{ task: ProjectTask; project: Project | null; rows: ProjectTask[] }>(
      `/api/project-tasks/${taskId}/progress`,
      {
        method: "PATCH",
        body: JSON.stringify({ actorId, completion }),
      },
    ),
};
