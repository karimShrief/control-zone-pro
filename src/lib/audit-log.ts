export type AuditEntityType =
  | "auth"
  | "task"
  | "incident"
  | "project"
  | "project-task"
  | "shift"
  | "shift-request"
  | "handover"
  | "sop";

export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  before?: unknown;
  after?: unknown;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const auditLogs: AuditLogEntry[] = [];

export function recordAuditLog(entry: Omit<AuditLogEntry, "id" | "createdAt">) {
  const log: AuditLogEntry = {
    ...entry,
    id: `AUD-${Date.now()}-${auditLogs.length + 1}`,
    createdAt: new Date().toISOString(),
  };
  auditLogs.unshift(log);
  return log;
}

export function listAuditLogs() {
  return [...auditLogs];
}
