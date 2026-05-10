import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageHeader, KpiCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { ShiftClockCard } from "@/components/ShiftClockCard";
import { tasks, incidents, projectTasks, handoverPoints, shifts, userById } from "@/lib/mock-data";
import { Briefcase, AlertTriangle, ListChecks, ClipboardList, Plus, FileWarning } from "lucide-react";

export const Route = createFileRoute("/my-work")({
  component: MyWork,
});

function MyWork() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  const myTasks = tasks.filter((t) => t.assignee === user.id);
  const sharedTasks = tasks.filter((t) => t.assignee === "shared");
  const unassigned = tasks.filter((t) => t.assignee === null);
  const myIncidents = incidents.filter((i) => i.assignee === user.id);
  const mySubtasks = projectTasks.filter((pt) => pt.assignee === user.id);
  const today = new Date().toISOString().slice(0, 10);
  const myShift = shifts.find((s) => s.date === today && s.engineers.includes(user.id));
  const myHandover = handoverPoints.filter((h) => h.owner === user.id);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title={`My Work — ${user.name.split(" ")[0]}`}
        subtitle="Your assigned items, shared operations, and shift context"
        actions={
          <>
            <Link to="/tasks" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
              <Plus className="h-4 w-4" /> Create Task
            </Link>
            <Link to="/incidents" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
              <FileWarning className="h-4 w-4" /> Create Incident
            </Link>
            <Link to="/handover" className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Submit Handover Point
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="My Tasks" value={myTasks.length} icon={ListChecks} tone="info" />
        <KpiCard label="My Incidents" value={myIncidents.length} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Project Subtasks" value={mySubtasks.length} icon={Briefcase} tone="info" />
        <KpiCard label="Pending Handover" value={myHandover.filter((h) => h.status !== "Resolved").length} icon={ClipboardList} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 space-y-4">
          <Section title="My Assigned Tasks" empty={myTasks.length === 0 ? "No assigned tasks" : undefined}>
            {myTasks.map((t) => (
              <Row key={t.id} id={t.id} title={t.title} meta={t.type} right={<><StatusBadge status={t.status} /><StatusBadge status={t.sla} /></>} />
            ))}
          </Section>

          <Section title="Shared Daily DC Operations" badge="All engineers can update">
            {sharedTasks.map((t) => (
              <Row key={t.id} id={t.id} title={t.title} meta={t.category} right={<><StatusBadge status={t.status} /></>} />
            ))}
          </Section>

          <Section title="My Project Subtasks">
            {mySubtasks.map((pt) => (
              <Row key={pt.id} id={pt.id} title={pt.title} meta={`Due ${pt.dueDate}`} right={<>
                <StatusBadge status={pt.status} />
                <span className="text-xs text-muted-foreground w-12 text-right">{pt.completion}%</span>
              </>} />
            ))}
          </Section>

          <Section title="Unassigned Items" badge="Pick up if you have capacity">
            {unassigned.map((t) => (
              <Row key={t.id} id={t.id} title={t.title} meta={t.type} right={<>
                <StatusBadge status={t.priority} />
                <button className="text-xs rounded border border-border px-2 py-0.5 hover:bg-muted">Take</button>
              </>} />
            ))}
          </Section>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold mb-2">My Shift Today</h3>
            {myShift ? (
              <>
                <div className="text-2xl font-semibold">{myShift.type}</div>
                <div className="text-xs text-muted-foreground mt-1">{myShift.date}</div>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">On shift with you</div>
                  <div className="flex flex-wrap gap-1.5">
                    {myShift.engineers.filter((id) => id !== user.id).map((id) => (
                      <span key={id} className="text-xs rounded-full bg-muted px-2 py-0.5">{userById(id).split(" ")[0]}</span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Off-shift today</div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold mb-3">My Incidents</h3>
            <div className="space-y-2">
              {myIncidents.length === 0 && <div className="text-sm text-muted-foreground">No incidents assigned</div>}
              {myIncidents.map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{i.id}</span>
                  <span className="flex-1 truncate">{i.title}</span>
                  <StatusBadge status={i.severity} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold mb-3">My Handover Points</h3>
            <div className="space-y-2">
              {myHandover.length === 0 && <div className="text-sm text-muted-foreground">None submitted</div>}
              {myHandover.map((h) => (
                <div key={h.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{h.title}</span>
                    <StatusBadge status={h.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">{h.shift} · {h.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, badge, empty }: { title: string; children: React.ReactNode; badge?: string; empty?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">{title}</h3>
        {badge && <span className="text-[11px] text-muted-foreground">{badge}</span>}
      </div>
      <div className="divide-y divide-border">
        {empty ? <div className="px-4 py-6 text-sm text-muted-foreground text-center">{empty}</div> : children}
      </div>
    </div>
  );
}

function Row({ id, title, meta, right }: { id: string; title: string; meta: string; right: React.ReactNode }) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <span className="font-mono text-[11px] text-muted-foreground w-16">{id}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground">{meta}</div>
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
