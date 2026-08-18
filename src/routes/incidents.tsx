import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { userById, type Incident, type IncidentCategory, type Severity } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { canCreateIncidents, canWorkIncidents } from "@/lib/rbac";
import { configurationService, incidentService } from "@/lib/services";
import {
  Plus,
  AlertTriangle,
  UserPlus,
  CheckCircle2,
  ArrowUpRight,
  MessageSquare,
  Upload,
  FileText,
} from "lucide-react";
import { DetailDrawer } from "@/components/DetailDrawer";
import { toast } from "sonner";

export const Route = createFileRoute("/incidents")({
  component: IncidentsPage,
});

function IncidentsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState(() => incidentService.list());
  const [sevFilter, setSevFilter] = useState<Severity | "All">("All");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Incident | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    severity: "SEV-3" as Severity,
    category: "Power" as IncidentCategory,
    shift: "Morning" as "Morning" | "Evening" | "Night",
    incidentAt: new Date().toISOString().slice(0, 16),
    impactDescription: "",
    immediateActionTaken: "",
    currentStatus: "Open",
    relatedTask: "",
    relatedHandover: "",
    notes: "",
  });
  const incidentRules = configurationService.listIncidentRules().filter((rule) => rule.active);

  const canCreate = canCreateIncidents(user);
  const canWork = canWorkIncidents(user);
  const refresh = () => setRows(incidentService.list());

  const assignToMe = (incident: Incident) => {
    if (!user || !canWork) return;
    incidentService.assignTo(incident.id, user.id, user.id);
    refresh();
    toast.success(`${incident.id} assigned`);
  };

  const acceptIncident = (incident: Incident) => {
    if (!user || !canWork) return;
    incidentService.updateStatus(incident.id, "Accepted", user.id);
    refresh();
    toast.success(`${incident.id} accepted`);
  };

  const escalateIncident = (incident: Incident) => {
    if (!user || !canWork) return;
    incidentService.escalate(incident.id, user.id);
    refresh();
    toast.success(`${incident.id} escalated to SEV-1`);
  };

  const createIncident = () => {
    if (!user || !canCreate) {
      toast.error("You do not have permission to create incidents.");
      return;
    }

    if (!draft.title.trim() || !draft.description.trim() || !draft.severity || !draft.category) {
      toast.error("Incident title, description, severity and category are required.");
      return;
    }

    if (!draft.incidentAt) {
      toast.error("Incident date and time are required.");
      return;
    }

    const incident = incidentService.create(user.id, {
      title: draft.title.trim(),
      description: draft.description.trim(),
      source: "Manual",
      category: draft.category,
      severity: draft.severity,
      shift: draft.shift,
      incidentAt: draft.incidentAt,
      impactDescription: draft.impactDescription.trim(),
      immediateActionTaken: draft.immediateActionTaken.trim(),
      currentStatus: draft.currentStatus,
      relatedTask: draft.relatedTask.trim() || null,
      relatedHandover: draft.relatedHandover.trim() || null,
      notes: draft.notes.trim(),
    });

    refresh();
    setCreateOpen(false);
    setDraft({
      title: "",
      description: "",
      severity: "SEV-3",
      category: "Power",
      shift: "Morning",
      incidentAt: new Date().toISOString().slice(0, 16),
      impactDescription: "",
      immediateActionTaken: "",
      currentStatus: "Open",
      relatedTask: "",
      relatedHandover: "",
      notes: "",
    });
    if (incident) toast.success(`${incident.id} created`);
  };

  const resolveIncident = (incident: Incident) => {
    if (!user || !canWork) return;
    incidentService.updateStatus(incident.id, "Resolved", user.id);
    refresh();
    toast.success(`${incident.id} resolved`);
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
        subtitle="Track operational issues, ownership, severity, SLA risk and resolution readiness."
        actions={
          canCreate ? (
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Create Incident
            </button>
          ) : null
        }
      />

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

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-1">Rule Guidance</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Configured incident rules suggest severity, SLA and SOP guidance when incidents are
              created.
            </p>
            <div className="space-y-2">
              {incidentRules.slice(0, 4).map((rule) => (
                <div key={rule.id} className="rounded-md border border-border bg-background p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{rule.category}</span>
                    <StatusBadge status={rule.defaultSeverity} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {rule.slaMinutes} min SLA / {rule.recommendedSop || "No SOP linked"}
                  </div>
                </div>
              ))}
              {!incidentRules.length ? (
                <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
                  No incident rules configured yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <input
              placeholder="Search incidents..."
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
                {!filtered.length ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center">
                      <div className="text-sm font-medium">No incidents match your view</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Adjust severity/search filters or create an incident from a configured rule.
                      </div>
                    </td>
                  </tr>
                ) : null}
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
                shift: active.shift,
                incidentAt: active.incidentAt,
                impactDescription: active.impactDescription,
                immediateActionTaken: active.immediateActionTaken,
                currentStatus: active.currentStatus,
                relatedTask: active.relatedTask,
                relatedHandover: active.relatedHandover,
                notes: active.notes,
              }
            : null
        }
      />

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Incident creation
                </div>
                <h3 className="mt-1 text-xl font-semibold text-foreground">Create Incident</h3>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="rounded-md border border-border px-2 py-1 text-sm hover:bg-muted"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="md:col-span-2 text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Incident title
                </span>
                <input
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Title"
                />
              </label>

              <label className="md:col-span-2 text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Detailed incident description
                </span>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  rows={4}
                  placeholder="Describe the incident and the service impact."
                />
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Shift
                </span>
                <select
                  value={draft.shift}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      shift: event.target.value as "Morning" | "Evening" | "Night",
                    })
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Incident date/time
                </span>
                <input
                  type="datetime-local"
                  value={draft.incidentAt}
                  onChange={(event) => setDraft({ ...draft, incidentAt: event.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Severity
                </span>
                <select
                  value={draft.severity}
                  onChange={(event) =>
                    setDraft({ ...draft, severity: event.target.value as Severity })
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="SEV-1">SEV-1</option>
                  <option value="SEV-2">SEV-2</option>
                  <option value="SEV-3">SEV-3</option>
                  <option value="SEV-4">SEV-4</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Category
                </span>
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft({ ...draft, category: event.target.value as IncidentCategory })
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="Power">Power</option>
                  <option value="Network">Network</option>
                  <option value="Server">Server</option>
                  <option value="Storage">Storage</option>
                  <option value="Cooling">Cooling</option>
                  <option value="Security">Security</option>
                  <option value="Access">Access</option>
                  <option value="Application">Application</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="md:col-span-2 text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Impact description
                </span>
                <textarea
                  value={draft.impactDescription}
                  onChange={(event) =>
                    setDraft({ ...draft, impactDescription: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  rows={3}
                  placeholder="What systems or services were affected?"
                />
              </label>

              <label className="md:col-span-2 text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Immediate action taken
                </span>
                <textarea
                  value={draft.immediateActionTaken}
                  onChange={(event) =>
                    setDraft({ ...draft, immediateActionTaken: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  rows={3}
                  placeholder="What did the team do right away?"
                />
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Current status
                </span>
                <input
                  value={draft.currentStatus}
                  onChange={(event) => setDraft({ ...draft, currentStatus: event.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Open"
                />
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Related task
                </span>
                <input
                  value={draft.relatedTask}
                  onChange={(event) => setDraft({ ...draft, relatedTask: event.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Optional"
                />
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Related handover
                </span>
                <input
                  value={draft.relatedHandover}
                  onChange={(event) => setDraft({ ...draft, relatedHandover: event.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Optional"
                />
              </label>

              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Notes
                </span>
                <textarea
                  value={draft.notes}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                  rows={3}
                  placeholder="Optional notes"
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setCreateOpen(false)}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={createIncident}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Create Incident
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
