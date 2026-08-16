import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { userById } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { canManageProjects } from "@/lib/rbac";
import { configurationService, projectService } from "@/lib/services";
import { Plus, FolderKanban, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState(() => projectService.list());
  const [templates, setTemplates] = useState(() =>
    configurationService.listProjectTemplates().filter((template) => template.active),
  );
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]?.id ?? "");
  const canCreateFromTemplate = canManageProjects(user);

  const refresh = () => {
    setProjects(projectService.list());
    const activeTemplates = configurationService
      .listProjectTemplates()
      .filter((template) => template.active);
    setTemplates(activeTemplates);
    setSelectedTemplate((current) => current || activeTemplates[0]?.id || "");
  };

  const createFromTemplate = () => {
    if (!user || !canCreateFromTemplate || !selectedTemplate) return;
    const project = projectService.createFromTemplate(user.id, selectedTemplate);
    if (!project) {
      toast.error("Action cannot be completed. Select an active project template first.");
      return;
    }
    refresh();
    toast.success(`${project.name} created from template`);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Projects & Readiness"
        subtitle="Track initiatives, operational improvements, audit actions, risk and delivery progress."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canCreateFromTemplate ? (
              <>
                <select
                  value={selectedTemplate}
                  onChange={(event) => setSelectedTemplate(event.target.value)}
                  title="Choose a configured project template"
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
                  onClick={createFromTemplate}
                  disabled={!selectedTemplate}
                  title="Create a project with standard phases and subtasks"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FolderKanban className="h-4 w-4" /> Use Template
                </button>
              </>
            ) : null}
            <button
              type="button"
              disabled
              title="Prototype only: manual project creation is not available in mock mode. Use the template flow instead."
              aria-label="Create a new project is unavailable in this prototype"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-md bg-primary/60 px-3 py-2 text-sm text-primary-foreground opacity-70"
              onClick={() =>
                toast.info("Manual project creation is not available in this prototype. Use a template instead.")
              }
            >
              <Plus className="h-4 w-4" /> New Project
            </button>
          </div>
        }
      />

      <section className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Template-driven delivery</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Admin-defined project templates can create standard phases, owners and governance
              checkpoints.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.slice(0, 3).map((template) => (
              <StatusBadge
                key={template.id}
                status={`${template.phases.length} phases`}
                tone="info"
              />
            ))}
            {!templates.length ? <StatusBadge status="No active templates" tone="neutral" /> : null}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {projects.map((p) => {
          const subs = projectService.listTasks(p.id);
          return (
            <Link
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              className="rounded-lg border border-border bg-card p-4 hover:border-primary transition group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                  <FolderKanban className="h-3.5 w-3.5" /> {p.type}
                </div>
                <StatusBadge status={p.status} />
              </div>
              <h3 className="font-semibold text-base group-hover:text-primary">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{p.completion}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${p.completion}%` }} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                  {p.team}
                </span>
                <StatusBadge status={p.priority} />
                <span className="text-muted-foreground">
                  Risk: <span className="font-medium text-foreground">{p.risk}</span>
                </span>
                {p.blockers.length > 0 && (
                  <span className="flex items-center gap-1 text-critical">
                    <AlertCircle className="h-3 w-3" /> {p.blockers.length} blocker
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Owner: {userById(p.owner).split(" ")[0]}</span>
                <span>
                  {subs.length} subtasks - Due {p.targetDate}
                </span>
              </div>
            </Link>
          );
        })}
        {!projects.length ? (
          <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
            <div className="text-sm font-medium">No projects or readiness actions found</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Create one manually or generate a project from a configured template.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
