import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import {
  users as appUsers,
  userById,
  type Priority,
  type Task,
  type TaskType,
  type TaskStatus,
} from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { canEditTask, canManageTasks } from "@/lib/rbac";
import { configurationService, taskService } from "@/lib/services";
import {
  Plus,
  Filter,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  CheckCircle2,
  ArrowUpRight,
  Upload,
  UserPlus,
} from "lucide-react";
import { DetailDrawer } from "@/components/DetailDrawer";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
});

const TYPES: (TaskType | "All")[] = [
  "All",
  "Daily DC Operation",
  "General Task",
  "NOC Task",
  "DC Task",
];

function TasksPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState(() => taskService.list());
  const [templates, setTemplates] = useState(() =>
    configurationService.listTaskTemplates().filter((template) => template.active),
  );
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]?.id ?? "");
  const [typeFilter, setTypeFilter] = useState<TaskType | "All">("All");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [active, setActive] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    description: "",
    details: "",
    acceptanceCriteria: "",
    type: "Daily DC Operation" as TaskType,
    category: "DC Operations",
    priority: "Medium" as Priority,
    assignee:
      appUsers.find((target) => target.role === "engineer" && target.status !== "Inactive")?.id ??
      "",
    dueDate: new Date().toISOString().slice(0, 10),
    relatedIncident: "",
    relatedProject: "",
    relatedHandover: "",
    notes: "",
  });

  const canUpdate = canManageTasks(user);
  const canGenerateFromTemplate = ["manager", "admin"].includes(user?.role ?? "");

  const refresh = () => {
    setRows(taskService.list());
    const activeTemplates = configurationService
      .listTaskTemplates()
      .filter((template) => template.active);
    setTemplates(activeTemplates);
    setSelectedTemplate((current) => current || activeTemplates[0]?.id || "");
  };

  const generateFromTemplate = () => {
    if (!user || !canGenerateFromTemplate || !selectedTemplate) return;
    const task = taskService.createFromTemplate(user.id, selectedTemplate);
    if (!task) {
      toast.error("Action cannot be completed. Select an active task template first.");
      return;
    }
    refresh();
    toast.success(`${task.id} generated from template`);
  };

  const escalateTask = (task: Task) => {
    if (!user || !canEditTask(user, task)) return;
    taskService.updateStatus(task.id, "Escalated", user.id);
    refresh();
    toast.success(`${task.id} escalated`);
  };

  const assignTask = (task: Task) => {
    if (!user || !["manager", "admin"].includes(user.role)) return;
    const availableEngineer = appUsers.find(
      (target) => target.role === "engineer" && target.status !== "Inactive",
    );
    if (!availableEngineer) {
      toast.error("Add an active engineer before assigning tasks");
      return;
    }
    taskService.assignTo(task.id, availableEngineer.id, user.id);
    refresh();
    toast.success(`${task.id} assigned to ${availableEngineer.name}`);
  };

  const filtered = rows.filter((t) => {
    if (typeFilter !== "All" && t.type !== typeFilter) return false;
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    if (search && !`${t.title} ${t.id}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const createTask = () => {
    if (!user || !["manager", "shift-lead", "admin"].includes(user.role)) {
      toast.error("You do not have permission to create tasks.");
      return;
    }
    if (!taskDraft.title.trim() || !taskDraft.description.trim()) {
      toast.error("Task title and description are required.");
      return;
    }
    if (!taskDraft.assignee) {
      toast.error("Assigned engineer is required.");
      return;
    }
    if (!taskDraft.priority) {
      toast.error("Priority is required.");
      return;
    }
    if (!taskDraft.dueDate) {
      toast.error("Due date is required.");
      return;
    }

    const created = taskService.create(user.id, {
      title: taskDraft.title,
      description: taskDraft.description,
      details: taskDraft.details,
      acceptanceCriteria: taskDraft.acceptanceCriteria,
      type: taskDraft.type,
      category: taskDraft.category,
      priority: taskDraft.priority,
      assignee: taskDraft.assignee,
      dueDate: taskDraft.dueDate,
      relatedIncident: taskDraft.relatedIncident || null,
      relatedProject: taskDraft.relatedProject || null,
      relatedHandover: taskDraft.relatedHandover || null,
      notes: taskDraft.notes,
    });

    if (!created) {
      toast.error("Unable to create task. Please review the required fields.");
      return;
    }

    setRows(taskService.list());
    setCreateOpen(false);
    setTaskDraft({
      title: "",
      description: "",
      details: "",
      acceptanceCriteria: "",
      type: "Daily DC Operation",
      category: "DC Operations",
      priority: "Medium",
      assignee:
        appUsers.find((target) => target.role === "engineer" && target.status !== "Inactive")?.id ??
        "",
      dueDate: new Date().toISOString().slice(0, 10),
      relatedIncident: "",
      relatedProject: "",
      relatedHandover: "",
      notes: "",
    });
    toast.success(`Task ${created.id} created successfully.`);
  };

  const summary = {
    total: rows.length,
    open: rows.filter((t) => !["Completed", "Cancelled"].includes(t.status)).length,
    breached: rows.filter((t) => t.sla === "Breached").length,
    blocked: rows.filter((t) => t.status === "Blocked" || t.status === "Escalated").length,
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Daily Operations"
        subtitle="Track DC/NOC work, checklist evidence, ownership and SLA risk."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canGenerateFromTemplate ? (
              <>
                <select
                  value={selectedTemplate}
                  onChange={(event) => setSelectedTemplate(event.target.value)}
                  title="Choose a configured task template"
                  className="rounded-md border border-input bg-card px-3 py-2 text-sm"
                >
                  {templates.length ? (
                    templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No active templates</option>
                  )}
                </select>
                <button
                  onClick={generateFromTemplate}
                  disabled={!selectedTemplate}
                  title="Generate operational work from the selected Configuration Center template"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> Generate Daily Work
                </button>
              </>
            ) : null}
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Create Task
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Left summary */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold mb-1 text-sm">Operations Summary</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Current task health across daily operations and assigned activities.
            </p>
            <div className="space-y-2 text-sm">
              <SummaryRow label="Total" value={summary.total} />
              <SummaryRow label="Open" value={summary.open} />
              <SummaryRow label="SLA Breached" value={summary.breached} tone="critical" />
              <SummaryRow label="Blocked / Escalated" value={summary.blocked} tone="warning" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold mb-1 text-sm">Template Guidance</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Admin-configured templates reduce repeat typing for daily DC/NOC activities.
            </p>
            <div className="space-y-2">
              {templates.slice(0, 4).map((template) => (
                <div
                  key={template.id}
                  className="rounded-md border border-border bg-background p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{template.name}</span>
                    <StatusBadge status={template.recurrence} tone="info" />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {template.checklist.length} checklist items
                    {template.evidenceRequired ? " / Evidence required" : ""}
                  </div>
                </div>
              ))}
              {!templates.length ? (
                <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
                  No task templates configured yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Filters</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Type
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`text-xs rounded-md px-2 py-1 border ${typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "All")}
                  className="mt-1.5 w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm"
                >
                  <option value="All">All</option>
                  {[
                    "New",
                    "In Progress",
                    "Pending Team",
                    "Waiting Vendor",
                    "Waiting Approval",
                    "Escalated",
                    "Blocked",
                    "Completed",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main table */}
        <div className="col-span-12 lg:col-span-9 rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <span className="text-xs text-muted-foreground">{filtered.length} results</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Title</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">SLA</th>
                  <th className="px-4 py-2.5">Assignee</th>
                  <th className="px-4 py-2.5">Due</th>
                  <th className="px-4 py-2.5">Audit</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() => setActive(t)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {t.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" /> {t.evidence}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{t.type}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.sla} />
                    </td>
                    <td className="px-4 py-3 text-xs">{userById(t.assignee)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.dueDate}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.audit} />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <RowBtn
                          title="Update Status"
                          icon={CheckCircle2}
                          onClick={() => setActive(t)}
                        />
                        <RowBtn
                          title="Add Note"
                          icon={MessageSquare}
                          onClick={() => setActive(t)}
                        />
                        {canEditTask(user, t) && (
                          <RowBtn title="Add Evidence" icon={Upload} onClick={() => setActive(t)} />
                        )}
                        {["manager", "admin"].includes(user?.role ?? "") && (
                          <RowBtn
                            title="Assign to first active engineer"
                            icon={UserPlus}
                            onClick={() => assignTask(t)}
                          />
                        )}
                        {canUpdate && canEditTask(user, t) && (
                          <RowBtn
                            title="Escalate"
                            icon={ArrowUpRight}
                            onClick={() => escalateTask(t)}
                          />
                        )}
                        <RowBtn title="More" icon={MoreHorizontal} onClick={() => setActive(t)} />
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center">
                      <div className="text-sm font-medium">No open items found</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Adjust filters or generate daily work from a configured task template.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DetailDrawer
        kind="task"
        open={!!active}
        onOpenChange={(v) => !v && setActive(null)}
        item={
          active
            ? {
                id: active.id,
                title: active.title,
                description: active.description,
                details: active.details,
                acceptanceCriteria: active.acceptanceCriteria,
                status: active.status,
                priority: active.priority,
                sla: active.sla,
                assignee: active.assignee,
                category: active.category,
                type: active.type,
                dueDate: active.dueDate,
                audit: active.audit,
                relatedIncident: active.relatedIncident,
                relatedProject: active.relatedProject,
                relatedHandover: active.relatedHandover,
                notes: active.notes,
              }
            : null
        }
      />

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Task creation
                </div>
                <h3 className="mt-1 text-xl font-semibold text-foreground">Create Task</h3>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="rounded-md border border-border px-2 py-1 text-sm hover:bg-muted"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="md:col-span-2 text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Task title
                </span>
                <input
                  value={taskDraft.title}
                  onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Task title"
                  required
                />
              </label>

              <label className="md:col-span-2 text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Description / details
                </span>
                <textarea
                  value={taskDraft.description}
                  onChange={(event) =>
                    setTaskDraft({ ...taskDraft, description: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  rows={4}
                  placeholder="Describe the operational task and why it matters."
                  required
                />
              </label>

              <label className="md:col-span-2 text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Acceptance criteria / expected outcome
                </span>
                <textarea
                  value={taskDraft.acceptanceCriteria}
                  onChange={(event) =>
                    setTaskDraft({ ...taskDraft, acceptanceCriteria: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  rows={3}
                  placeholder="What defines a successful completion?"
                />
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Priority
                </span>
                <select
                  value={taskDraft.priority}
                  onChange={(event) =>
                    setTaskDraft({ ...taskDraft, priority: event.target.value as Priority })
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Category
                </span>
                <input
                  value={taskDraft.category}
                  onChange={(event) => setTaskDraft({ ...taskDraft, category: event.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="DC Operations"
                />
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Task type
                </span>
                <select
                  value={taskDraft.type}
                  onChange={(event) =>
                    setTaskDraft({ ...taskDraft, type: event.target.value as TaskType })
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="Daily DC Operation">Daily DC Operation</option>
                  <option value="General Task">General Task</option>
                  <option value="NOC Task">NOC Task</option>
                  <option value="DC Task">DC Task</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Assigned engineer
                </span>
                <select
                  value={taskDraft.assignee}
                  onChange={(event) => setTaskDraft({ ...taskDraft, assignee: event.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Select engineer</option>
                  {appUsers
                    .filter(
                      (engineer) => engineer.role === "engineer" && engineer.status !== "Inactive",
                    )
                    .map((engineer) => (
                      <option key={engineer.id} value={engineer.id}>
                        {engineer.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Due date
                </span>
                <input
                  type="date"
                  value={taskDraft.dueDate}
                  onChange={(event) => setTaskDraft({ ...taskDraft, dueDate: event.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                />
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Related incident
                </span>
                <input
                  value={taskDraft.relatedIncident}
                  onChange={(event) =>
                    setTaskDraft({ ...taskDraft, relatedIncident: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Optional"
                />
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Related project
                </span>
                <input
                  value={taskDraft.relatedProject}
                  onChange={(event) =>
                    setTaskDraft({ ...taskDraft, relatedProject: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Optional"
                />
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Related handover
                </span>
                <input
                  value={taskDraft.relatedHandover}
                  onChange={(event) =>
                    setTaskDraft({ ...taskDraft, relatedHandover: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Optional"
                />
              </label>

              <label className="md:col-span-2 text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Notes
                </span>
                <textarea
                  value={taskDraft.notes}
                  onChange={(event) => setTaskDraft({ ...taskDraft, notes: event.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  rows={3}
                  placeholder="Optional operational notes."
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setCreateOpen(false)}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={createTask}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RowBtn({
  title,
  icon: Icon,
  onClick,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="rounded-md p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "critical" | "warning";
}) {
  const cls =
    tone === "critical"
      ? "text-critical"
      : tone === "warning"
        ? "text-warning-foreground"
        : "text-foreground";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${cls}`}>{value}</span>
    </div>
  );
}
