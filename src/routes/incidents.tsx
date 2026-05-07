import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { incidents, userById, type Severity, type IncidentCategory } from "@/lib/mock-data";
import { Plus, AlertTriangle, UserPlus, CheckCircle2, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/incidents")({
  component: IncidentsPage,
});

function IncidentsPage() {
  const [sevFilter, setSevFilter] = useState<Severity | "All">("All");
  const [search, setSearch] = useState("");

  const filtered = incidents.filter((i) => {
    if (sevFilter !== "All" && i.severity !== sevFilter) return false;
    if (search && !(`${i.title} ${i.id}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const bySev = (s: Severity) => incidents.filter((i) => i.severity === s).length;
  const bySource: Record<string, number> = {};
  incidents.forEach((i) => { bySource[i.source] = (bySource[i.source] ?? 0) + 1; });
  const byCat: Record<string, number> = {};
  incidents.forEach((i) => { byCat[i.category] = (byCat[i.category] ?? 0) + 1; });

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Incidents"
        subtitle="Active and recent operational incidents · sourced from monitoring, handovers, manual entry and ITSM"
        actions={
          <button className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Create Incident
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Severity</h3>
            <div className="space-y-1.5">
              {(["SEV-1", "SEV-2", "SEV-3", "SEV-4"] as Severity[]).map((s) => (
                <button key={s} onClick={() => setSevFilter(s === sevFilter ? "All" : s)} className={`w-full flex items-center justify-between text-sm rounded-md px-2 py-1.5 ${sevFilter === s ? "bg-muted" : "hover:bg-muted/50"}`}>
                  <StatusBadge status={s} />
                  <span className="font-semibold">{bySev(s)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">By Source</h3>
            <div className="space-y-1.5 text-sm">
              {Object.entries(bySource).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">By Category</h3>
            <div className="space-y-1.5 text-sm">
              {Object.entries(byCat).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <input
              placeholder="Search incidents…"
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
                  <th className="px-4 py-2.5">Sev</th>
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Title</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Source</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Assignee</th>
                  <th className="px-4 py-2.5">SLA</th>
                  <th className="px-4 py-2.5">Created</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3"><StatusBadge status={i.severity} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{i.title}</div>
                      <div className="text-xs text-muted-foreground">{i.subcategory}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">{i.category}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{i.source}</div>
                      <div className="text-muted-foreground font-mono">{i.sourceRef}</div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-4 py-3 text-xs">{userById(i.assignee)}</td>
                    <td className="px-4 py-3"><StatusBadge status={i.sla} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{i.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {!i.assignee && <IconBtn label="Assign" icon={UserPlus} />}
                        {i.assignee && i.status !== "Closed" && i.status !== "Resolved" && <IconBtn label="Accept" icon={CheckCircle2} />}
                        <IconBtn label="Escalate" icon={ArrowUpRight} />
                      </div>
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

function IconBtn({ label, icon: Icon }: { label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <button title={label} className="rounded-md p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground">
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
