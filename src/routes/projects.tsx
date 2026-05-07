import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { projects, projectTasks, userById } from "@/lib/mock-data";
import { Plus, FolderKanban, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Projects"
        subtitle="Projects, initiatives, operational improvements and audit actions"
        actions={
          <button className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New Project
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {projects.map((p) => {
          const subs = projectTasks.filter((pt) => pt.projectId === p.id);
          return (
            <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }} className="rounded-lg border border-border bg-card p-4 hover:border-primary transition group">
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
                <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">{p.team}</span>
                <StatusBadge status={p.priority} />
                <span className="text-muted-foreground">Risk: <span className="font-medium text-foreground">{p.risk}</span></span>
                {p.blockers.length > 0 && (
                  <span className="flex items-center gap-1 text-critical"><AlertCircle className="h-3 w-3" /> {p.blockers.length} blocker</span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Owner: {userById(p.owner).split(" ")[0]}</span>
                <span>{subs.length} subtasks · Due {p.targetDate}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
