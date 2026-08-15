import { Link, createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageHeader, KpiCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import {
  tasks,
  incidents,
  projects,
  shifts,
  handoverPoints,
  productivity,
  monthlyTrend,
  userById,
} from "@/lib/data";
import {
  AlertTriangle,
  ListChecks,
  Activity,
  Users,
  ShieldCheck,
  TrendingUp,
  Clock,
  FolderKanban,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
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
  const slaBreaches =
    tasks.filter((t) => t.sla === "Breached").length +
    incidents.filter((i) => i.sla === "Breached").length;
  const unassignedInc = incidents.filter((i) => !i.assignee).length;
  const projectsAtRisk = projects.filter((p) => p.status === "At Risk" || p.risk === "High").length;
  const blocked = tasks.filter((t) => t.status === "Blocked").length;
  const today = new Date().toISOString().slice(0, 10);
  const todaysShifts = shifts.filter((s) => s.date === today);
  const handoverComplete = handoverPoints.length
    ? Math.round(
        (handoverPoints.filter((h) => h.acknowledged).length / handoverPoints.length) * 100,
      )
    : 0;
  const avgProductivitySla = productivity.length
    ? Math.round(productivity.reduce((a, p) => a + p.sla, 0) / productivity.length)
    : 0;

  const workloadByEng = productivity.map((p) => ({
    name: p.name,
    open: p.open,
    completed: p.completed,
  }));
  const criticalItems = [
    ...tasks
      .filter((t) => t.sla === "Breached" || t.status === "Blocked" || t.status === "Escalated")
      .map((t) => ({
        kind: "Task",
        id: t.id,
        title: t.title,
        status: t.status,
        sla: t.sla,
        owner: userById(t.assignee),
      })),
    ...incidents
      .filter((i) => i.sla !== "On Track" || i.severity === "SEV-1")
      .map((i) => ({
        kind: "Incident",
        id: i.id,
        title: i.title,
        status: i.severity,
        sla: i.sla,
        owner: userById(i.assignee),
      })),
  ].slice(0, 6);
  const incidentByCat = ["Network", "Cooling", "Power", "Storage", "Security", "Application"].map(
    (c) => ({
      name: c,
      value: incidents.filter((i) => i.category === c).length,
    }),
  );
  const hasIncidentCategoryData = incidentByCat.some((item) => item.value > 0);
  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--info)",
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Command View"
        subtitle="Monitor team workload, incidents, projects, shift readiness, and operational risks in one view."
      />

      <section className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Operations Health
            </div>
            <h2 className="mt-1 text-xl font-semibold">
              {slaBreaches || projectsAtRisk || blocked
                ? "Attention required before the next handover"
                : "Operational readiness is clear"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Review SLA risk, critical work, roster coverage and handover quality from one command
              workspace.
            </p>
          </div>
          <CommandSignal
            label="Service Availability"
            value={slaBreaches ? "SLA Risk" : "Normal"}
            tone={slaBreaches ? "critical" : "success"}
          />
          <CommandSignal
            label="Governance"
            value={handoverComplete >= 80 || !handoverPoints.length ? "Audited" : "Requires Review"}
            tone={handoverComplete >= 80 || !handoverPoints.length ? "success" : "warning"}
          />
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Open Work" value={openTasks} icon={ListChecks} tone="info" />
        <KpiCard
          label="SLA Breaches"
          value={slaBreaches}
          icon={AlertTriangle}
          tone="critical"
          sub="Tasks + Incidents"
        />
        <KpiCard
          label="Unassigned Incidents"
          value={unassignedInc}
          icon={AlertTriangle}
          tone="warning"
        />
        <KpiCard
          label="Projects at Risk"
          value={projectsAtRisk}
          icon={FolderKanban}
          tone="warning"
        />
        <KpiCard label="Blocked Items" value={blocked} icon={ShieldCheck} tone="critical" />
        <KpiCard
          label="Handover Ack."
          value={`${handoverComplete}%`}
          icon={Activity}
          tone="success"
        />
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
          {workloadByEng.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={workloadByEng}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                  }}
                />
                <Legend />
                <Bar
                  dataKey="completed"
                  stackId="a"
                  fill="var(--chart-2)"
                  name="Completed"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="open"
                  stackId="a"
                  fill="var(--chart-1)"
                  name="Open"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState text="No productivity data loaded yet." />
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Incidents by Category</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </div>
          {hasIncidentCategoryData ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={incidentByCat}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                >
                  {incidentByCat.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState text="No incidents have been loaded yet." />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Critical Items</h3>
            <span className="text-xs text-muted-foreground">Top breaches and blocked work</span>
          </div>
          <div className="divide-y divide-border">
            {criticalItems.length ? (
              criticalItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-[11px] font-mono text-muted-foreground w-20">
                    {item.id}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-16">
                    {item.kind}
                  </span>
                  <span className="flex-1 text-sm truncate">{item.title}</span>
                  <StatusBadge status={item.status} />
                  <StatusBadge status={item.sla} />
                  <span className="text-xs text-muted-foreground w-32 truncate">{item.owner}</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-10 text-center">
                <div className="text-sm font-medium">No critical work needs command attention</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  SLA risks, blocked work and SEV-1 incidents will appear here.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Shift Coverage Today</h3>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {todaysShifts.length ? (
              todaysShifts.map((s) => (
                <div key={s.type} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{s.type} Shift</span>
                    <StatusBadge status={s.engineers.length >= 3 ? "Approved" : "At Risk"} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.engineers.map((id) => (
                      <span
                        key={id}
                        className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground"
                      >
                        {userById(id).split(" ")[0]}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
                <div className="text-sm font-medium">No roster published for today</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Build or import the monthly roster from the Configuration Center.
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Productivity (avg SLA)</span>
              <span className="font-semibold">{avgProductivitySla}%</span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={monthlyTrend}>
                <Line
                  type="monotone"
                  dataKey="sla"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                />
                <XAxis dataKey="month" hide />
                <YAxis hide domain={[80, 100]} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <h3 className="mb-2 text-sm font-semibold">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <QuickAction to="/import-center" label="Open Import Center" />
              <QuickAction to="/shifts" label="Review Shift Readiness" />
              <QuickAction to="/handover" label="Audit Handover Quality" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommandSignal({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "critical";
}) {
  const color =
    tone === "success"
      ? "border-success/30 bg-success/10 text-success"
      : tone === "warning"
        ? "border-warning/30 bg-warning/10 text-warning-foreground"
        : "border-critical/30 bg-critical/10 text-critical";
  return (
    <div className={`rounded-lg border px-4 py-3 ${color}`}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function ChartEmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function QuickAction({
  to,
  label,
}: {
  to: "/import-center" | "/shifts" | "/handover";
  label: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
    >
      {label}
    </Link>
  );
}

function ExecutiveDashboard() {
  const slaCompliance = Math.round(monthlyTrend.at(-1)?.sla ?? 0);
  const projectAvg = projects.length
    ? Math.round(projects.reduce((a, p) => a + p.completion, 0) / projects.length)
    : 0;
  const risks = projects.filter((p) => p.risk === "High").length;
  const hasTrend = monthlyTrend.length > 0;
  const healthValue = hasTrend
    ? slaCompliance >= 95 && risks === 0
      ? "Healthy"
      : "Needs Review"
    : "No Data";

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Executive Operations Summary"
        subtitle="High-level operations health and monthly trend - read-only view"
      />

      <section className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Governance View
            </div>
            <h2 className="mt-1 text-lg font-semibold">Operational readiness without edit noise</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Executives see service health, SLA compliance, project progress and major risk only.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="Role Restricted" tone="info" />
            <StatusBadge status="Audited" tone="success" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Operations Health"
          value={healthValue}
          tone={
            healthValue === "Healthy"
              ? "success"
              : healthValue === "No Data"
                ? "neutral"
                : "warning"
          }
          icon={Activity}
          sub={hasTrend ? "Based on SLA and risk signals" : "Load operational trend data"}
        />
        <KpiCard
          label="SLA Compliance"
          value={`${slaCompliance}%`}
          tone="success"
          icon={ShieldCheck}
          sub="Last 30 days"
        />
        <KpiCard
          label="Project Progress"
          value={`${projectAvg}%`}
          tone="info"
          icon={TrendingUp}
          sub={`${projects.length} active`}
        />
        <KpiCard
          label="Major Risks"
          value={risks}
          tone="warning"
          icon={AlertTriangle}
          sub="Requires leadership attention"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-1">Monthly Incident Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Created vs Resolved - 6 months</p>
          {hasTrend ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="incidents"
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                  name="Created"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  name="Resolved"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState text="No monthly incident trend data loaded yet." />
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-1">SLA Compliance Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Target: 95%</p>
          {hasTrend ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={[80, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sla"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  name="SLA %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState text="No SLA trend data loaded yet." />
          )}
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
                <div className="text-xs text-muted-foreground">
                  {p.type} - {p.team}
                </div>
              </div>
              <div className="col-span-2">
                <StatusBadge status={p.status} />
              </div>
              <div className="col-span-1 text-xs text-muted-foreground">
                Risk: <span className="font-medium text-foreground">{p.risk}</span>
              </div>
              <div className="col-span-3">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${p.completion}%` }} />
                </div>
              </div>
              <div className="col-span-1 text-right text-sm font-medium">{p.completion}%</div>
            </div>
          ))}
          {!projects.length ? (
            <div className="px-4 py-10 text-center">
              <div className="text-sm font-medium">No portfolio data loaded yet</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Project summaries will appear here after real project data is added.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
