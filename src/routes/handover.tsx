import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, KpiCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { userById, type HandoverCategory, type HandoverPoint, type Priority } from "@/lib/data";
import { canAuditHandover, canSubmitHandover } from "@/lib/rbac";
import { handoverService, shiftService } from "@/lib/services";
import { Plus, ClipboardList, CheckCheck, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/handover")({
  component: HandoverPage,
});

type ShiftFilter = "All" | HandoverPoint["shift"];
type DraftHandoverRow = {
  key: string;
  title: string;
  category: HandoverCategory;
  priority: Priority;
  relatedRef: string;
  nextAction: string;
  notes: string;
};

const CATEGORY_OPTIONS: HandoverCategory[] = [
  "Incident",
  "Task",
  "Project",
  "Maintenance",
  "Alert",
  "Access",
  "General",
];
const PRIORITY_OPTIONS: Priority[] = ["Low", "Medium", "High", "Critical"];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function createDraftRow(): DraftHandoverRow {
  return {
    key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: "",
    category: "General",
    priority: "Medium",
    relatedRef: "",
    nextAction: "",
    notes: "",
  };
}

function HandoverPage() {
  const { user } = useAuth();
  const shiftOptions = shiftService.listShiftTypes().filter((shiftType) => shiftType.enabled);
  const [rows, setRows] = useState(() => handoverService.list());
  const [shift, setShift] = useState<ShiftFilter>("All");
  const [dateFilter, setDateFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [handoverDate, setHandoverDate] = useState(todayValue());
  const [handoverShift, setHandoverShift] = useState<HandoverPoint["shift"]>(
    shiftOptions[0]?.name ?? "Morning",
  );
  const [draftRows, setDraftRows] = useState<DraftHandoverRow[]>(() => [createDraftRow()]);

  const canAudit = canAuditHandover(user);
  const canSubmit = canSubmitHandover(user);
  const isManager = canAudit;
  const filtered = useMemo(
    () =>
      rows.filter((handover) => {
        if (shift !== "All" && handover.shift !== shift) return false;
        if (dateFilter && handover.date !== dateFilter) return false;
        return true;
      }),
    [dateFilter, rows, shift],
  );
  const acknowledgedPct = rows.length
    ? Math.round((rows.filter((handover) => handover.acknowledged).length / rows.length) * 100)
    : 0;

  const refresh = () => setRows(handoverService.list());

  const updateAudit = (handover: HandoverPoint, audit: HandoverPoint["audit"]) => {
    if (!user || !canAudit) return;
    handoverService.updateAudit(handover.id, audit, user.id);
    refresh();
    toast.success(`${handover.id} marked ${audit.toLowerCase()}`);
  };

  const updateDraftRow = (key: string, input: Partial<DraftHandoverRow>) => {
    setDraftRows((current) => current.map((row) => (row.key === key ? { ...row, ...input } : row)));
  };

  const removeDraftRow = (key: string) => {
    setDraftRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.key !== key),
    );
  };

  const resetForm = () => {
    setHandoverDate(todayValue());
    setHandoverShift(shiftOptions[0]?.name ?? "Morning");
    setDraftRows([createDraftRow()]);
    setShowForm(false);
  };

  const submitHandoverRows = () => {
    if (!user || !canSubmit) return;
    const invalid = draftRows.some(
      (row) => !row.title.trim() || !row.nextAction.trim() || !row.notes.trim(),
    );
    if (!handoverDate) {
      toast.error("Handover date is required");
      return;
    }
    if (invalid) {
      toast.error("Title, next action and notes are required for every row");
      return;
    }

    draftRows.forEach((row) => {
      handoverService.create(user.id, {
        date: handoverDate,
        shift: handoverShift,
        title: row.title.trim(),
        category: row.category,
        priority: row.priority,
        relatedRef: row.relatedRef.trim() || undefined,
        nextAction: row.nextAction.trim(),
        notes: row.notes.trim(),
      });
    });
    refresh();
    toast.success(`${draftRows.length} handover row${draftRows.length > 1 ? "s" : ""} submitted`);
    resetForm();
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title={isManager ? "Handover Review" : "Shift Handover"}
        subtitle={
          isManager
            ? "Audit handover quality, acknowledgement and critical open items."
            : "Submit multiple handover rows for the same date and shift, then review open points."
        }
        actions={
          canSubmit && (
            <button
              onClick={() => setShowForm((value) => !value)}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Add Handover Rows
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total Points" value={rows.length} icon={ClipboardList} />
        <KpiCard
          label="Acknowledged"
          value={`${acknowledgedPct}%`}
          icon={CheckCheck}
          tone="success"
        />
        <KpiCard
          label="Critical Open"
          value={
            rows.filter(
              (handover) =>
                handover.priority === "Critical" ||
                (handover.priority === "High" && handover.status === "Open"),
            ).length
          }
          icon={AlertTriangle}
          tone="critical"
        />
        <KpiCard
          label="Needs Audit Update"
          value={rows.filter((handover) => handover.audit === "Needs Update").length}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      {showForm && canSubmit ? (
        <section className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold">New handover batch</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add as many rows as needed for the selected date and shift.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Date</span>
                <input
                  type="date"
                  value={handoverDate}
                  onChange={(event) => setHandoverDate(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Shift
                </span>
                <select
                  value={handoverShift}
                  onChange={(event) =>
                    setHandoverShift(event.target.value as HandoverPoint["shift"])
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {shiftOptions.map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => setDraftRows((current) => [...current, createDraftRow()])}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <Plus className="h-4 w-4" /> Add Row
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {draftRows.map((row, index) => (
              <div key={row.key} className="rounded-md border border-border bg-background p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium">Row {index + 1}</h3>
                  <button
                    onClick={() => removeDraftRow(row.key)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <TextField
                    label="Title"
                    value={row.title}
                    onChange={(value) => updateDraftRow(row.key, { title: value })}
                  />
                  <SelectField
                    label="Category"
                    value={row.category}
                    options={CATEGORY_OPTIONS}
                    onChange={(value) =>
                      updateDraftRow(row.key, { category: value as HandoverCategory })
                    }
                  />
                  <SelectField
                    label="Priority"
                    value={row.priority}
                    options={PRIORITY_OPTIONS}
                    onChange={(value) => updateDraftRow(row.key, { priority: value as Priority })}
                  />
                  <TextField
                    label="Related reference"
                    value={row.relatedRef}
                    onChange={(value) => updateDraftRow(row.key, { relatedRef: value })}
                  />
                  <TextField
                    label="Next action"
                    value={row.nextAction}
                    onChange={(value) => updateDraftRow(row.key, { nextAction: value })}
                  />
                  <TextAreaField
                    label="Notes"
                    value={row.notes}
                    onChange={(value) => updateDraftRow(row.key, { notes: value })}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={submitHandoverRows}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              <CheckCheck className="h-4 w-4" /> Submit Rows
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Handover rows</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Multiple rows can share the same date and shift.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Date</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="mt-1.5 rounded-md border border-input bg-background px-3 py-2"
              />
            </label>
            <div className="flex items-center gap-1">
              {(["All", ...shiftOptions.map((item) => item.name)] as ShiftFilter[]).map(
                (option) => (
                  <button
                    key={option}
                    onClick={() => setShift(option)}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      shift === option
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {option}
                  </button>
                ),
              )}
            </div>
            {dateFilter ? (
              <button
                onClick={() => setDateFilter("")}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                Clear Date
              </button>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Date / Shift</th>
                <th className="px-4 py-2.5">Point</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Owner</th>
                <th className="px-4 py-2.5">Audit</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((handover) => (
                <tr key={handover.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {handover.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{handover.date}</div>
                    <div className="text-xs text-muted-foreground">{handover.shift}</div>
                  </td>
                  <td className="px-4 py-3 min-w-[320px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{handover.title}</span>
                      <StatusBadge status={handover.category} tone="info" />
                      {handover.relatedRef ? (
                        <span className="text-xs text-muted-foreground">
                          Ref: {handover.relatedRef}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{handover.notes}</p>
                    <div className="mt-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs">
                      Next: {handover.nextAction}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={handover.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={handover.status} />
                  </td>
                  <td className="px-4 py-3 text-xs">{userById(handover.owner)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={handover.acknowledged ? "Approved" : "Pending"} />
                      <StatusBadge status={handover.audit} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isManager ? (
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => updateAudit(handover, "Approved")}
                          className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateAudit(handover, "Needs Update")}
                          className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                        >
                          Needs Update
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Read only</span>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No handover rows match the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm md:col-span-2 xl:col-span-3">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2"
      />
    </label>
  );
}
