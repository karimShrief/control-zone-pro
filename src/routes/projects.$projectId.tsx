import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { userById, type ProjectTask } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { canEditProjectTask, canManageProjects } from "@/lib/rbac";
import { projectService } from "@/lib/services";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectDetail,
});

const TABS = ["Overview", "Tasks", "Kanban", "Timeline", "Risks", "Comments", "Evidence"] as const;

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();
  const project = projectService.get(projectId);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [rows, setRows] = useState(() => projectService.listTasks(projectId));

  if (!project) return <Navigate to="/projects" />;
  const subs = rows;
  const canManage = canManageProjects(user);

  const refresh = () => setRows(projectService.listTasks(project.id));

  const addProjectTask = () => {
    if (!user || !canManage) return;
    const task = projectService.createTask(project.id, user.id);
    refresh();
    if (task) toast.success(`${task.id} added`);
  };

  const updateProgress = (task: ProjectTask) => {
    if (!user || !canEditProjectTask(user, task)) return;
    projectService.updateTaskProgress(
      task.id,
      task.completion >= 100 ? 100 : task.completion + 25,
      user.id,
    );
    refresh();
    toast.success(`${task.id} progress updated`);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> All Projects
      </Link>
      <PageHeader
        title={project.name}
        subtitle={`${project.type} · ${project.team} team · Owner ${userById(project.owner)}`}
        actions={
          <>
            <StatusBadge status={project.status} />
            {canManage && (
              <button
                onClick={addProjectTask}
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Add Project Task
              </button>
            )}
          </>
        }
      />

      <div className="border-b border-border mb-6 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${tab === t ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Progress</h3>
                <span className="text-sm font-semibold">{project.completion}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${project.completion}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Start</div>
                  <div className="font-medium">{project.startDate}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Target</div>
                  <div className="font-medium">{project.targetDate}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Risk</div>
                  <StatusBadge status={project.risk} />
                </div>
              </div>
            </div>
            {project.blockers.length > 0 && (
              <div className="rounded-lg border border-critical/30 bg-critical/5 p-4">
                <h3 className="font-semibold text-critical mb-2">Active Blockers</h3>
                <ul className="space-y-1 text-sm">
                  {project.blockers.map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
              <Field label="Sponsor" value={userById(project.sponsor)} />
              <Field label="Team" value={project.team} />
              <Field label="Priority">
                <StatusBadge status={project.priority} />
              </Field>
              <Field label="Impact" value={project.impact} />
            </div>
          </div>
        </div>
      )}

      {tab === "Tasks" && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Assignee</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Due</th>
                <th className="px-4 py-2.5">Progress</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subs.map((pt) => (
                <tr key={pt.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{pt.id}</td>
                  <td className="px-4 py-3 font-medium">{pt.title}</td>
                  <td className="px-4 py-3 text-xs">{userById(pt.assignee)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={pt.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={pt.priority} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{pt.dueDate}</td>
                  <td className="px-4 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pt.completion}%` }} />
                      </div>
                      <span className="text-xs w-9 text-right">{pt.completion}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {(["To Do", "In Progress", "Review", "Blocked", "Done"] as const).map((col) => (
            <div key={col} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">{col}</span>
                <span className="text-xs text-muted-foreground">
                  {subs.filter((s) => s.status === col).length}
                </span>
              </div>
              <div className="space-y-2">
                {subs
                  .filter((s) => s.status === col)
                  .map((s) => (
                    <div key={s.id} className="rounded-md border border-border bg-background p-2.5">
                      <div className="text-xs font-mono text-muted-foreground mb-1">{s.id}</div>
                      <div className="text-sm font-medium mb-2">{s.title}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {userById(s.assignee).split(" ")[0]}
                        </span>
                        <StatusBadge status={s.priority} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Timeline" && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="space-y-3">
            {subs.map((s) => (
              <div key={s.id} className="flex items-center gap-4">
                <div className="w-32 text-xs text-muted-foreground">{s.dueDate}</div>
                <div className="flex-1 h-8 bg-muted rounded-md relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/30"
                    style={{ width: `${s.completion}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3 text-xs font-medium">
                    {s.title}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {(tab === "Risks" || tab === "Comments" || tab === "Evidence") && (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          {tab} view — mock data placeholder.
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children ?? <span className="font-medium">{value}</span>}
    </div>
  );
}
