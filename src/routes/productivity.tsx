import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, KpiCard } from "@/components/AppShell";
import { productivity, monthlyTrend } from "@/lib/data";
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
  Legend,
} from "recharts";
import { TrendingUp, ListChecks, Activity } from "lucide-react";

export const Route = createFileRoute("/productivity")({
  component: ProductivityPage,
});

function ProductivityPage() {
  const totalCompleted = productivity.reduce((a, p) => a + p.completed, 0);
  const avgSla = productivity.length
    ? Math.round(productivity.reduce((a, p) => a + p.sla, 0) / productivity.length)
    : 0;
  const totalOpen = productivity.reduce((a, p) => a + p.open, 0);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Team Productivity"
        subtitle="Engineer throughput, SLA performance and trends"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Tasks Completed"
          value={totalCompleted}
          icon={ListChecks}
          tone="success"
          sub="This month"
        />
        <KpiCard label="Open Tasks" value={totalOpen} icon={Activity} tone="info" />
        <KpiCard label="Avg SLA" value={`${avgSla}%`} icon={TrendingUp} tone="success" />
        <KpiCard label="Engineers" value={productivity.length} sub="Active operators" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-3">Throughput by Engineer</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivity}>
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
                fill="var(--chart-2)"
                name="Completed"
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="open" fill="var(--chart-3)" name="Open" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-3">SLA % by Engineer</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis domain={[80, 100]} stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                }}
              />
              <Bar dataKey="sla" fill="var(--chart-1)" name="SLA %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
          <h3 className="font-semibold mb-3">6-Month Operations Trend</h3>
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
                name="Incidents"
              />
              <Line
                type="monotone"
                dataKey="resolved"
                stroke="var(--chart-2)"
                strokeWidth={2}
                name="Resolved"
              />
              <Line
                type="monotone"
                dataKey="sla"
                stroke="var(--chart-1)"
                strokeWidth={2}
                name="SLA %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
