import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { tasks, userById, type Task, type TaskType, type TaskStatus } from "@/lib/mock-data";
import { Plus, Filter, MessageSquare, Paperclip, MoreHorizontal, CheckCircle2, ArrowUpRight, Upload } from "lucide-react";
import { DetailDrawer } from "@/components/DetailDrawer";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
});

const TYPES: (TaskType | "All")[] = ["All", "Daily DC Operation", "General Task", "NOC Task", "DC Task"];

function TasksPage() {
  const [typeFilter, setTypeFilter] = useState<TaskType | "All">("All");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [active, setActive] = useState<Task | null>(null);

  const filtered = tasks.filter((t) => {
    if (typeFilter !== "All" && t.type !== typeFilter) return false;
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    if (search && !(`${t.title} ${t.id}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const summary = {
    total: tasks.length,
    open: tasks.filter((t) => !["Completed", "Cancelled"].includes(t.status)).length,
    breached: tasks.filter((t) => t.sla === "Breached").length,
    blocked: tasks.filter((t) => t.status === "Blocked" || t.status === "Escalated").length,
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Tasks"
        subtitle="Daily DC operations, NOC tasks, DC tasks and general work"
        actions={
          <button className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Task
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Left summary */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold mb-3 text-sm">Summary</h3>
            <div className="space-y-2 text-sm">
              <SummaryRow label="Total" value={summary.total} />
              <SummaryRow label="Open" value={summary.open} />
              <SummaryRow label="SLA Breached" value={summary.breached} tone="critical" />
              <SummaryRow label="Blocked / Escalated" value={summary.blocked} tone="warning" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Filters</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Type</label>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`text-xs rounded-md px-2 py-1 border ${typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "All")}
                  className="mt-1.5 w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm"
                >
                  <option value="All">All</option>
                  {["New", "In Progress", "Pending Team", "Waiting Vendor", "Waiting Approval", "Escalated", "Blocked", "Completed"].map((s) => (
                    <option key={s} value={s}>{s}</option>
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
              placeholder="Search tasks…"
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
                  <tr key={t.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {t.comments}</span>
                        <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" /> {t.evidence}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{t.type}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.sla} /></td>
                    <td className="px-4 py-3 text-xs">{userById(t.assignee)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.dueDate}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.audit} /></td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-primary hover:underline">Open</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, tone }: { label: string; value: number; tone?: "critical" | "warning" }) {
  const cls = tone === "critical" ? "text-critical" : tone === "warning" ? "text-warning-foreground" : "text-foreground";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${cls}`}>{value}</span>
    </div>
  );
}
