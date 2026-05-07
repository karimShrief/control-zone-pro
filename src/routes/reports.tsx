import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { FileText, Download, Calendar, BarChart3, Activity, FolderKanban, ClipboardList, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

const REPORTS = [
  { name: "Daily Operations Report", desc: "Daily snapshot of tasks, incidents and shift activity", icon: Calendar, period: "Daily" },
  { name: "Weekly Productivity Report", desc: "Engineer throughput and SLA breakdown", icon: BarChart3, period: "Weekly" },
  { name: "Monthly Executive Report", desc: "High-level KPIs and risks for leadership", icon: Activity, period: "Monthly" },
  { name: "SLA Report", desc: "SLA compliance across tasks and incidents", icon: ShieldCheck, period: "Monthly" },
  { name: "Project Progress Report", desc: "Status, milestones and blockers across all projects", icon: FolderKanban, period: "Bi-weekly" },
  { name: "Handover Report", desc: "Handover quality, acknowledgement rate and audit status", icon: ClipboardList, period: "Weekly" },
];

function ReportsPage() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Reports" subtitle="Generate and export operational reports · ISO 27001 aligned audit trail" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.name} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{r.period}</span>
              </div>
              <h3 className="font-semibold">{r.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              <div className="mt-4 flex items-center gap-2">
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs rounded-md border border-border px-3 py-1.5 hover:bg-muted">
                  <FileText className="h-3.5 w-3.5" /> Preview
                </button>
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs rounded-md bg-primary text-primary-foreground px-3 py-1.5 hover:bg-primary/90">
                  <Download className="h-3.5 w-3.5" /> Export
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
