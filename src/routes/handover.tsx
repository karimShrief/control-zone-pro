import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, KpiCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import {
  userById,
  type HandoverCategory,
  type HandoverPoint,
  type Priority,
} from "@/lib/mock-data";
import { canAuditHandover, canSubmitHandover } from "@/lib/rbac";
import { backendClient } from "@/lib/backend-client";
import { handoverService } from "@/lib/services";
import { Plus, ClipboardList, CheckCheck, AlertTriangle, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/handover")({
  component: HandoverPage,
});

type ShiftFilter = "All" | HandoverPoint["shift"];

type DraftHandover = {
  id: string;
  shift: HandoverPoint["shift"];
  title: string;
  category: HandoverCategory;
  priority: Priority;
  status: HandoverPoint["status"];
  relatedRef: string;
  nextAction: string;
  notes: string;
};

const categories: HandoverCategory[] = [
  "Incident",
  "Task",
  "Project",
  "Maintenance",
  "Alert",
  "Access",
  "General",
];
const priorities: Priority[] = ["Low", "Medium", "High", "Critical"];
const statuses: HandoverPoint["status"][] = ["Open", "Monitoring", "Resolved"];

const createDraft = (shift: ShiftFilter): DraftHandover => ({
  id: crypto.randomUUID(),
  shift: shift === "Night" ? "Night" : "Morning",
  title: "",
  category: "General",
  priority: "Medium",
  status: "Open",
  relatedRef: "",
  nextAction: "",
  notes: "",
});

function HandoverPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<HandoverPoint[]>(() => handoverService.list());
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [shift, setShift] = useState<ShiftFilter>("All");
  const [drafts, setDrafts] = useState<DraftHandover[]>(() => [createDraft("All")]);

  const canAudit = canAuditHandover(user);
  const canSubmit = canSubmitHandover(user);
  const filtered = rows.filter((h) => shift === "All" || h.shift === shift);
  const isManager = canAudit;
  const acknowledgedPercent = rows.length
    ? Math.round((rows.filter((h) => h.acknowledged).length / rows.length) * 100)
    : 0;

  useEffect(() => {
    refreshRows();
  }, []);

  const refreshRows = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await backendClient.listHandover();
      setRows(response.rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load handover rows";
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAudit = async (handover: HandoverPoint, audit: HandoverPoint["audit"]) => {
    if (!user || !canAudit) return;
    try {
      const response = await backendClient.updateHandoverAudit(user.id, handover.id, audit);
      setRows(response.rows);
      toast.success(`${handover.id} marked ${audit.toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update audit status");
    }
  };

  const acknowledgeHandover = async (handover: HandoverPoint) => {
    if (!user || !canAudit) return;
    try {
      const response = await backendClient.acknowledgeHandover(user.id, handover.id);
      setRows(response.rows);
      toast.success(`${handover.id} acknowledged`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to acknowledge handover");
    }
  };

  const updateDraft = <K extends keyof DraftHandover>(
    id: string,
    key: K,
    value: DraftHandover[K],
  ) => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, [key]: value } : draft)),
    );
  };

  const addDraftRow = () => {
    setDrafts((current) => [...current, createDraft(shift)]);
  };

  const removeDraftRow = (id: string) => {
    setDrafts((current) =>
      current.length === 1 ? [createDraft(shift)] : current.filter((draft) => draft.id !== id),
    );
  };

  const submitHandovers = async () => {
    if (!user || !canSubmit) return;
    const incomplete = drafts.some(
      (draft) => !draft.title.trim() || !draft.nextAction.trim() || !draft.notes.trim(),
    );

    if (incomplete) {
      toast.error("Title, next action and notes are required for every handover row.");
      return;
    }

    try {
      const response = await backendClient.createHandoverRows(
        user.id,
        drafts.map((draft) => ({
          shift: draft.shift,
          title: draft.title,
          category: draft.category,
          priority: draft.priority,
          status: draft.status,
          relatedRef: draft.relatedRef,
          nextAction: draft.nextAction,
          notes: draft.notes,
        })),
      );

      setRows(response.rows);
      setDrafts([createDraft(shift)]);
      toast.success(
        `${response.created.length} handover row${response.created.length === 1 ? "" : "s"} submitted`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit handover rows");
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title={isManager ? "Handover Review" : "Shift Handover"}
        subtitle={
          isManager
            ? "Audit handover quality, acknowledgement and critical open items"
            : "Submit and review handover points by date and shift"
        }
      />

      {loadError && (
        <div className="mb-4 rounded-md border border-critical/30 bg-critical/5 px-3 py-2 text-sm text-critical">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total Points" value={rows.length} icon={ClipboardList} />
        <KpiCard
          label="Acknowledged"
          value={`${acknowledgedPercent}%`}
          icon={CheckCheck}
          tone="success"
        />
        <KpiCard
          label="Critical Open"
          value={
            rows.filter(
              (h) => h.priority === "Critical" || (h.priority === "High" && h.status === "Open"),
            ).length
          }
          icon={AlertTriangle}
          tone="critical"
        />
        <KpiCard
          label="Needs Audit Update"
          value={rows.filter((h) => h.audit === "Needs Update").length}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      <div className="flex items-center gap-2 mb-4">
        {(["All", "Morning", "Night"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setShift(s)}
            className={`text-sm rounded-md px-3 py-1.5 border ${
              shift === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {canSubmit && (
        <section className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold">Add Handover Rows</h2>
              <p className="text-sm text-muted-foreground">
                Add one or more handover points before submitting the shift package.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addDraftRow}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <Plus className="h-4 w-4" /> Add Row
              </button>
              <button
                onClick={submitHandovers}
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
              >
                <Send className="h-4 w-4" /> Submit Rows
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {drafts.map((draft, index) => (
              <div
                key={draft.id}
                className="grid gap-3 rounded-md border border-border p-3 lg:grid-cols-12"
              >
                <div className="lg:col-span-1">
                  <label className="text-xs text-muted-foreground">Shift</label>
                  <select
                    value={draft.shift}
                    onChange={(event) =>
                      updateDraft(draft.id, "shift", event.target.value as HandoverPoint["shift"])
                    }
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div className="lg:col-span-3">
                  <label className="text-xs text-muted-foreground">Title</label>
                  <input
                    value={draft.title}
                    onChange={(event) => updateDraft(draft.id, "title", event.target.value)}
                    placeholder="What must the next shift know?"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <select
                    value={draft.category}
                    onChange={(event) =>
                      updateDraft(draft.id, "category", event.target.value as HandoverCategory)
                    }
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-1">
                  <label className="text-xs text-muted-foreground">Priority</label>
                  <select
                    value={draft.priority}
                    onChange={(event) =>
                      updateDraft(draft.id, "priority", event.target.value as Priority)
                    }
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-1">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft(draft.id, "status", event.target.value as HandoverPoint["status"])
                    }
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-1">
                  <label className="text-xs text-muted-foreground">Ref</label>
                  <input
                    value={draft.relatedRef}
                    onChange={(event) => updateDraft(draft.id, "relatedRef", event.target.value)}
                    placeholder="INC-2041"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="text-xs text-muted-foreground">Next Action</label>
                  <input
                    value={draft.nextAction}
                    onChange={(event) => updateDraft(draft.id, "nextAction", event.target.value)}
                    placeholder="Owner and next step"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="lg:col-span-1 flex items-end justify-between gap-2">
                  <span className="pb-2 text-xs text-muted-foreground">Row {index + 1}</span>
                  <button
                    onClick={() => removeDraftRow(draft.id)}
                    className="mb-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-muted"
                    aria-label={`Remove row ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="lg:col-span-12">
                  <label className="text-xs text-muted-foreground">Notes</label>
                  <textarea
                    value={draft.notes}
                    onChange={(event) => updateDraft(draft.id, "notes", event.target.value)}
                    placeholder="Current condition, evidence, constraints or context"
                    rows={2}
                    className="mt-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-3">
        {isLoading && (
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading latest handover rows...
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No handover rows match this filter.
          </div>
        )}
        {filtered.map((h) => (
          <div key={h.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{h.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {h.date} - {h.shift} shift
                  </span>
                  <StatusBadge status={h.category} tone="info" />
                  <StatusBadge status={h.priority} />
                  {h.relatedRef && (
                    <span className="text-xs text-muted-foreground">Ref {h.relatedRef}</span>
                  )}
                </div>
                <h3 className="font-semibold">{h.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{h.notes}</p>
                <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Required Next Action
                  </div>
                  {h.nextAction}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 min-w-[140px]">
                <StatusBadge status={h.status} />
                <StatusBadge status={h.acknowledged ? "Approved" : "Pending"} />
                <StatusBadge status={h.audit} />
                <span className="text-xs text-muted-foreground">
                  {userById(h.owner).split(" ")[0]}
                </span>
                {isManager && (
                  <div className="flex flex-wrap justify-end gap-1 mt-1">
                    {!h.acknowledged && (
                      <button
                        onClick={() => acknowledgeHandover(h)}
                        className="text-xs rounded border border-border px-2 py-0.5 hover:bg-muted"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => updateAudit(h, "Approved")}
                      className="text-xs rounded border border-border px-2 py-0.5 hover:bg-muted"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateAudit(h, "Needs Update")}
                      className="text-xs rounded border border-border px-2 py-0.5 hover:bg-muted"
                    >
                      Needs Update
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
