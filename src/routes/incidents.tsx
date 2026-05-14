import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import {
  userById,
  type Incident,
  type IncidentCategory,
  type IncidentSource,
  type Severity,
} from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { canCreateIncidents, canWorkIncidents } from "@/lib/rbac";
import { backendClient } from "@/lib/backend-client";
import { incidentService } from "@/lib/services";
import {
  Plus,
  AlertTriangle,
  UserPlus,
  CheckCircle2,
  ArrowUpRight,
  MessageSquare,
  Upload,
  FileText,
  Activity,
} from "lucide-react";
import { DetailDrawer } from "@/components/DetailDrawer";
import { toast } from "sonner";

export const Route = createFileRoute("/incidents")({
  component: IncidentsPage,
});

const incidentSources: IncidentSource[] = [
  "Manual",
  "Monitoring Alert",
  "Handover",
  "Project Issue",
  "ITSM Ticket Mock",
];
const incidentCategories: IncidentCategory[] = [
  "Network",
  "Server",
  "Storage",
  "Power",
  "Cooling",
  "Security",
  "Access",
  "Application",
  "Unknown",
];

function IncidentsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Incident[]>(() => incidentService.list());
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<
    Pick<Incident, "title" | "description" | "source" | "category">
  >({
    title: "",
    description: "",
    source: "Manual",
    category: "Unknown",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [sevFilter, setSevFilter] = useState<Severity | "All">("All");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Incident | null>(null);

  const canCreate = canCreateIncidents(user);
  const canWork = canWorkIncidents(user);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await backendClient.listIncidents();
      setRows(response.rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load incidents";
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const assignToMe = async (incident: Incident) => {
    if (!user || !canWork) return;
    try {
      const response = await backendClient.assignIncident(user.id, incident.id, user.id);
      setRows(response.rows);
      toast.success(`${incident.id} assigned`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to assign incident");
    }
  };

  const acceptIncident = async (incident: Incident) => {
    if (!user || !canWork) return;
    try {
      const response = await backendClient.updateIncidentStatus(user.id, incident.id, "Accepted");
      setRows(response.rows);
      toast.success(`${incident.id} accepted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to accept incident");
    }
  };

  const progressIncident = async (incident: Incident) => {
    if (!user || !canWork) return;
    try {
      const response = await backendClient.updateIncidentStatus(
        user.id,
        incident.id,
        "In Progress",
      );
      setRows(response.rows);
      toast.success(`${incident.id} in progress`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to progress incident");
    }
  };

  const escalateIncident = async (incident: Incident) => {
    if (!user || !canWork) return;
    try {
      const response = await backendClient.escalateIncident(user.id, incident.id);
      setRows(response.rows);
      toast.success(`${incident.id} escalated to SEV-1`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to escalate incident");
    }
  };

  const createIncident = async () => {
    if (!user || !canCreate) return;
    if (!draft.title.trim() || !draft.description.trim()) {
      toast.error("Incident title and description are required.");
      return;
    }
    try {
      const response = await backendClient.createIncident(user.id, {
        title: draft.title.trim(),
        description: draft.description.trim(),
        source: draft.source,
        category: draft.category,
      });
      setRows(response.rows);
      setDraft({ title: "", description: "", source: "Manual", category: "Unknown" });
      setIsCreating(false);
      toast.success(`${response.incident.id} created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create incident");
    }
  };

  const resolveIncident = async (incident: Incident) => {
    if (!user || !canWork) return;
    try {
      const response = await backendClient.updateIncidentStatus(user.id, incident.id, "Resolved");
      setRows(response.rows);
      toast.success(`${incident.id} resolved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resolve incident");
    }
  };

  const filtered = rows.filter((i) => {
    if (sevFilter !== "All" && i.severity !== sevFilter) return false;
    if (search && !`${i.title} ${i.id}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const bySev = (s: Severity) => rows.filter((i) => i.severity === s).length;
  const bySource: Record<string, number> = {};
  rows.forEach((i) => {
    bySource[i.source] = (bySource[i.source] ?? 0) + 1;
  });
  const byCat: Record<string, number> = {};
  rows.forEach((i) => {
    byCat[i.category] = (byCat[i.category] ?? 0) + 1;
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Incidents"
        subtitle="Active and recent operational incidents · sourced from monitoring, handovers, manual entry and ITSM"
        actions={
          canCreate ? (
            <button
              onClick={() => setIsCreating((current) => !current)}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> {isCreating ? "Close Form" : "Create Incident"}
            </button>
          ) : null
        }
      />

      {loadError && (
        <div className="mb-4 rounded-md border border-critical/30 bg-critical/5 px-3 py-2 text-sm text-critical">
          {loadError}
        </div>
      )}

      {canCreate && isCreating && (
        <section className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="text-xs text-muted-foreground">Title</label>
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Short incident title"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Source</label>
              <select
                value={draft.source}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    source: event.target.value as IncidentSource,
                  }))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
              >
                {incidentSources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <select
                value={draft.category}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    category: event.target.value as IncidentCategory,
                  }))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
              >
                {incidentCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <label className="text-xs text-muted-foreground">Description</label>
              <textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="What happened, where, and what is the operational impact?"
                rows={3}
                className="mt-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={createIncident}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Add Incident
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Severity
            </h3>
            <div className="space-y-1.5">
              {(["SEV-1", "SEV-2", "SEV-3", "SEV-4"] as Severity[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSevFilter(s === sevFilter ? "All" : s)}
                  className={`w-full flex items-center justify-between text-sm rounded-md px-2 py-1.5 ${sevFilter === s ? "bg-muted" : "hover:bg-muted/50"}`}
                >
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
                {isLoading && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-6 text-center text-sm text-muted-foreground"
                    >
                      Loading latest incidents...
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-6 text-center text-sm text-muted-foreground"
                    >
                      No incidents match the current filters.
                    </td>
                  </tr>
                )}
                {filtered.map((i) => (
                  <tr
                    key={i.id}
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() => setActive(i)}
                  >
                    <td className="px-4 py-3">
                      <StatusBadge status={i.severity} />
                    </td>
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
                    <td className="px-4 py-3">
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="px-4 py-3 text-xs">{userById(i.assignee)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={i.sla} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{i.createdAt}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        {canWork && !i.assignee && (
                          <IconBtn
                            label="Assign to me"
                            icon={UserPlus}
                            onClick={() => assignToMe(i)}
                          />
                        )}
                        {canWork &&
                          i.assignee &&
                          i.status !== "Closed" &&
                          i.status !== "Resolved" && (
                            <IconBtn
                              label="Accept"
                              icon={CheckCircle2}
                              onClick={() => acceptIncident(i)}
                            />
                          )}
                        {canWork &&
                          i.assignee &&
                          !["In Progress", "Resolved", "Closed"].includes(i.status) && (
                            <IconBtn
                              label="Progress"
                              icon={Activity}
                              onClick={() => progressIncident(i)}
                            />
                          )}
                        {canWork && (
                          <IconBtn
                            label="Comment"
                            icon={MessageSquare}
                            onClick={() => setActive(i)}
                          />
                        )}
                        {canWork && (
                          <IconBtn
                            label="Attach evidence"
                            icon={Upload}
                            onClick={() => setActive(i)}
                          />
                        )}
                        {canWork && (
                          <IconBtn
                            label="Attach report"
                            icon={FileText}
                            onClick={() => setActive(i)}
                          />
                        )}
                        {canWork && i.status !== "Resolved" && i.status !== "Closed" && (
                          <IconBtn
                            label="Resolve"
                            icon={CheckCircle2}
                            onClick={() => resolveIncident(i)}
                          />
                        )}
                        {canWork && (
                          <IconBtn
                            label="Escalate"
                            icon={ArrowUpRight}
                            onClick={() => escalateIncident(i)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DetailDrawer
        kind="incident"
        open={!!active}
        onOpenChange={(v) => !v && setActive(null)}
        item={
          active
            ? {
                id: active.id,
                title: active.title,
                description: active.description,
                status: active.status,
                severity: active.severity,
                sla: active.sla,
                assignee: active.assignee,
                category: active.category,
                subcategory: active.subcategory,
                createdAt: active.createdAt,
                source: active.source,
                sourceRef: active.sourceRef,
                resolution: active.resolution,
              }
            : null
        }
        onUpdated={refresh}
      />
    </div>
  );
}

function IconBtn({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className="rounded-md p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
