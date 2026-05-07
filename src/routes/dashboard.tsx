import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageHeader, KpiCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import {
  tasks, incidents, projects, shifts, handoverPoints, productivity, monthlyTrend, userById,
} from "@/lib/mock-data";
import {
  AlertTriangle, ListChecks, Activity, Users, ShieldCheck, TrendingUp, Clock, FolderKanban,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  if (user.role === "executive") return <ExecutiveDashboard />;
  return <ManagerDashboard />;
}

function ManagerDashboard() {
  const openTasks = tasks.filter((t) => !["Completed", "Cancelled"].includes(t.status)).length;
  const slaBreaches = tasks.filter((t) => t.sla === "Breached").length + incidents.filter((i) => i.sla === "Breached").length;
  const unassignedInc = incidents.filter((i) => !i.assignee).length;
  const projectsAtRisk = projects.filter((p) => p.status === "At Risk" || p.risk === "High").length;
  const blocked = tasks.filter((t) => t.status === "Blocked").length;
  const today = new Date().toISOString().slice(0, 10);
  const todaysShifts = shifts.filter((s) => s.date === today);
  const handoverComplete = Math.round((handoverPoints.filter((h) => h.acknowledged).length / handoverPoints.length) * 100);

  const workloadByEng = productivity.map((p) => ({ name: p.name, open: p.open, completed: p.completed }));
  const incidentByCat = ["Network", "Cooling", "Power", "Storage", "Security", "Application"].map((c) => ({
    name: c, value: incidents.filter((i) => i.category === c).length || 1,
  }));
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--info)"];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Command View"
        subtitle="Live operations overview · DC and NOC teams"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Open Work" value={openTasks} icon={ListChecks} tone="info" />
        <KpiCard label="SLA Breaches" value={slaBreaches} icon={AlertTriangle} tone="critical" sub="Tasks + Incidents" />
        <KpiCard label="Unassigned Incidents" value={unassignedInc} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Projects at Risk" value={projectsAtRisk} icon={FolderKanban} tone="warning" />
        <KpiCard label="Blocked Items" value={blocked} icon={ShieldCheck} tone="critical" />
        <KpiCard label="Handover Ack." value={`${handoverComplete}%`} icon={Activity} tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Team Workload</h3>
              <p className="text-xs text-muted-foreground">Open vs completed by engineer</p>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={workloadByEng}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="var(--chart-2)" name="Completed" radius={[0, 0, 0, 0]} />
              <Bar dataKey="open" stackId="a" fill="var(--chart-1)" name="Open" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Incidents by Category</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={incidentByCat} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                {incidentByCat.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Critical Items</h3>
            <span className="text-xs text-muted-foreground">Top breaches and blocked work</span>
          </div>
          <div className="divide-y divide-border">
            {[
              ...tasks.filter((t) => t.sla === "Breached" || t.status === "Blocked" || t.status === "Escalated").map((t) => ({ kind: "Task", id: t.id, title: t.title, status: t.status, sla: t.sla, owner: userById(t.assignee) })),
              ...incidents.filter((i) => i.sla !== "On Track" || i.severity === "SEV-1").map((i) => ({ kind: "Incident", id: i.id, title: i.title, status: i.severity, sla: i.sla, owner: userById(i.assignee) })),
            ].slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3">
                <span className="text-[11px] font-mono text-muted-foreground w-20">{item.id}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-16">{item.kind}</span>
                <span className="flex-1 text-sm truncate">{item.title}</span>
                <StatusBadge status={item.status} />
                <StatusBadge status={item.sla} />
                <span className="text-xs text-muted-foreground w-32 truncate">{item.owner}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Shift Coverage Today</h3>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {todaysShifts.map((s) => (
              <div key={s.type} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{s.type} Shift</span>
                  <StatusBadge status={s.engineers.length >= 3 ? "Approved" : "At Risk"} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.engineers.map((id) => (
                    <span key={id} className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                      {userById(id).split(" ")[0]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Productivity (avg SLA)</span>
              <span className="font-semibold">{Math.round(productivity.reduce((a, p) => a + p.sla, 0) / productivity.length)}%</span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={monthlyTrend}>
                <Line type="monotone" dataKey="sla" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <XAxis dataKey="month" hide />
                <YAxis hide domain={[80, 100]} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutiveDashboard() {
  const slaCompliance = Math.round(monthlyTrend[monthlyTrend.length - 1].sla);
  const projectAvg = Math.round(projects.reduce((a, p) => a + p.completion, 0) / projects.length);
  const risks = projects.filter((p) => p.risk === "High").length;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Executive Dashboard"
        subtitle="High-level operations health · read-only view"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Operations Health" value="Healthy" tone="success" icon={Activity} sub="All critical systems online" />
        <KpiCard label="SLA Compliance" value={`${slaCompliance}%`} tone="success" icon={ShieldCheck} sub="Last 30 days" />
        <KpiCard label="Project Progress" value={`${projectAvg}%`} tone="info" icon={TrendingUp} sub={`${projects.length} active`} />
        <KpiCard label="Major Risks" value={risks} tone="warning" icon={AlertTriangle} sub="Requires leadership attention" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-1">Monthly Incident Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Created vs Resolved · 6 months</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Legend />
              <Line type="monotone" dataKey="incidents" stroke="var(--chart-4)" strokeWidth={2} name="Created" />
              <Line type="monotone" dataKey="resolved" stroke="var(--chart-2)" strokeWidth={2} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-1">SLA Compliance Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Target: 95%</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={[80, 100]} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Line type="monotone" dataKey="sla" stroke="var(--chart-1)" strokeWidth={3} name="SLA %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold">Project Portfolio Summary</h3>
        </div>
        <div className="divide-y divide-border">
          {projects.map((p) => (
            <div key={p.id} className="px-4 py-3 grid grid-cols-12 gap-3 items-center">
              <div className="col-span-5">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.type} · {p.team}</div>
              </div>
              <div className="col-span-2"><StatusBadge status={p.status} /></div>
              <div className="col-span-1 text-xs text-muted-foreground">Risk: <span className="font-medium text-foreground">{p.risk}</span></div>
              <div className="col-span-3">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${p.completion}%` }} />
                </div>
              </div>
              <div className="col-span-1 text-right text-sm font-medium">{p.completion}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
