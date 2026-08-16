import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, KpiCard } from "@/components/AppShell";
import { ShiftClockCard } from "@/components/ShiftClockCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { canManageRoster, canSubmitShiftRequests } from "@/lib/rbac";
import {
  users as appUsers,
  userById,
  type Shift,
  type ShiftRequest,
  type ShiftType,
} from "@/lib/data";
import { shiftRequestService, shiftService } from "@/lib/services";
import { useShiftClock, fmtTime, fmtDuration, durationMinutes } from "@/lib/shift-clock";
import {
  CalendarDays,
  CircleDot,
  Clock,
  Edit3,
  Eye,
  Filter,
  MessageSquare,
  Moon,
  Repeat,
  Search,
  Settings,
  Sun,
  Sunset,
  UserMinus,
  UserPlus,
  Wand2,
  ClipboardCheck,
  Database,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/shifts")({
  component: ShiftsPage,
});

type EditorMode = "view" | "edit" | "add" | "remove" | "note";

const REQUEST_TYPES: ShiftRequest["type"][] = [
  "Shift Swap",
  "Leave Early",
  "Change Shift",
  "Absence Note",
];

function ShiftsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rosterFor } = useShiftClock();
  const today = new Date().toISOString().slice(0, 10);
  const shiftTypes = shiftService.listShiftTypes().filter((shiftType) => shiftType.enabled);
  const activeEngineers = appUsers.filter(
    (target) =>
      target.status !== "Inactive" && (target.role === "engineer" || target.role === "shift-lead"),
  );
  const [rows, setRows] = useState(() => shiftService.listSchedule());
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState("");
  const [shiftFilter, setShiftFilter] = useState<ShiftType | "All">("All");
  const [engineerFilter, setEngineerFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{ shift: Shift; mode: EditorMode } | null>(null);
  const [requestShift, setRequestShift] = useState<Shift | null>(null);
  const [dialogEngineer, setDialogEngineer] = useState(activeEngineers[0]?.id ?? "");
  const [dialogLead, setDialogLead] = useState("");
  const [dialogStatus, setDialogStatus] = useState<NonNullable<Shift["coverageStatus"]>>("Covered");
  const [dialogNote, setDialogNote] = useState("");
  const [requestType, setRequestType] = useState<ShiftRequest["type"]>("Shift Swap");
  const [requestTargetShift, setRequestTargetShift] = useState<ShiftType>(
    shiftTypes[1]?.name ?? "Evening",
  );
  const [requestReason, setRequestReason] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [generatedRoster, setGeneratedRoster] = useState<Shift[]>([]);
  const [builderForm, setBuilderForm] = useState({
    startDate: today,
    endDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    selectedEngineers: activeEngineers.slice(0, 3).map((engineer) => engineer.id),
    morningMinimum: 2,
    eveningMinimum: 2,
    nightMinimum: 2,
    workDays: 6,
    offDays: 2,
    mandatoryEngineer: "u1",
    mandatoryRuleType: "Must be scheduled",
    mandatoryShift: "Morning" as ShiftType,
    reason: "Karim must be Morning shift.",
  });

  const canEditRoster = canManageRoster(user);
  const canSubmitRequest = canSubmitShiftRequests(user);
  const canGenerateRoster = user ? ["manager", "admin"].includes(user.role) : false;
  const currentShiftType = shiftService.currentShiftType();
  const currentShift = rows.find(
    (shift) => shift.date === today && shift.type === currentShiftType,
  );
  const conflicts = shiftService.listConflicts();

  const visibleRows = useMemo(() => {
    return rows
      .filter((shift) => {
        if (user?.role === "engineer" || user?.role === "shift-lead") {
          const canSeeCurrentRoster = shift.date === today;
          const isOwnShift = shift.engineers.includes(user.id);
          if (!canSeeCurrentRoster && !isOwnShift) return false;
        }
        if (dateFrom && shift.date < dateFrom) return false;
        if (dateTo && shift.date > dateTo) return false;
        if (shiftFilter !== "All" && shift.type !== shiftFilter) return false;
        if (engineerFilter !== "All" && !shift.engineers.includes(engineerFilter)) return false;
        const haystack = `${shift.date} ${shift.type} ${shift.engineers.map(userById).join(" ")} ${
          shift.shiftLead ? userById(shift.shiftLead) : ""
        } ${shift.notes ?? ""}`.toLowerCase();
        if (search.trim() && !haystack.includes(search.trim().toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => `${a.date}-${a.type}`.localeCompare(`${b.date}-${b.type}`));
  }, [dateFrom, dateTo, engineerFilter, rows, search, shiftFilter, today, user]);

  const upcoming = visibleRows.filter((shift) => shift.date >= today).slice(0, 4);
  const coveredCount = rows.filter((shift) => shift.coverageStatus === "Covered").length;
  const attentionCount = rows.filter((shift) =>
    ["Understaffed", "Pending Update", "Conflict"].includes(shift.coverageStatus ?? ""),
  ).length;

  const refresh = () => setRows(shiftService.listSchedule());

  const buildRosterPreview = () => {
    const start = new Date(`${builderForm.startDate}T00:00:00`);
    const end = new Date(`${builderForm.endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      toast.error("Select a valid date range before generating the roster.");
      return;
    }

    const selected = builderForm.selectedEngineers.length
      ? builderForm.selectedEngineers
      : activeEngineers.map((engineer) => engineer.id);
    const preview: Shift[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const date = cursor.toISOString().slice(0, 10);
      (["Morning", "Evening", "Night"] as ShiftType[]).forEach((shiftType, index) => {
        const minimum =
          shiftType === "Morning"
            ? builderForm.morningMinimum
            : shiftType === "Evening"
              ? builderForm.eveningMinimum
              : builderForm.nightMinimum;

        let engineers = [...selected];
        if (index === 0) {
          engineers = selected.slice(0, Math.max(minimum, 1));
        } else if (index === 1) {
          engineers = selected.slice(1, Math.min(selected.length, Math.max(minimum, 1) + 1));
        } else {
          engineers = selected.slice(2, Math.min(selected.length, Math.max(minimum, 1) + 2));
        }

        if (
          builderForm.mandatoryEngineer &&
          (builderForm.mandatoryShift === "Any" || builderForm.mandatoryShift === shiftType)
        ) {
          if (!engineers.includes(builderForm.mandatoryEngineer)) {
            engineers = [builderForm.mandatoryEngineer, ...engineers];
          }
        }
        engineers = Array.from(new Set(engineers)).slice(
          0,
          Math.max(minimum + 1, engineers.length),
        );
        const coverageStatus = engineers.length >= minimum ? "Covered" : "Understaffed";
        const shift: Shift = {
          date,
          type: shiftType,
          engineers,
          shiftLead: engineers[0] || builderForm.mandatoryEngineer || undefined,
          coverageStatus,
          notes: builderForm.reason || "Generated schedule preview",
        };
        preview.push(shift);
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    setGeneratedRoster(preview);
    setBuilderOpen(false);
    toast.success(`Roster preview generated for ${preview.length} shifts.`);
  };

  const publishGeneratedRoster = () => {
    if (!user || !generatedRoster.length) {
      toast.error("Generate a roster preview before publishing.");
      return;
    }
    shiftService.importShifts(user.id, generatedRoster);
    setRows(shiftService.listSchedule());
    toast.success("Generated roster published to the live shift board.");
  };

  const openEditor = (shift: Shift, mode: EditorMode) => {
    const availableEngineer =
      activeEngineers.find((engineer) => !shift.engineers.includes(engineer.id))?.id ??
      activeEngineers[0]?.id ??
      "";
    setDialogEngineer(mode === "remove" ? (shift.engineers[0] ?? "") : availableEngineer);
    setDialogLead(shift.shiftLead ?? shift.engineers[0] ?? "");
    setDialogStatus(shift.coverageStatus ?? "Covered");
    setDialogNote(shift.notes ?? "");
    setEditor({ shift, mode });
  };

  const saveEditor = () => {
    if (!user || !editor) return;
    const { shift, mode } = editor;
    if (mode === "edit") {
      shiftService.updateShift(shift.date, shift.type, user.id, {
        shiftLead: dialogLead || undefined,
        coverageStatus: dialogStatus,
        notes: dialogNote,
      });
      toast.success("Shift assignment updated");
    }
    if (mode === "add" && dialogEngineer) {
      shiftService.addEngineer(shift.date, shift.type, dialogEngineer, user.id);
      toast.success(`${userById(dialogEngineer)} added to shift`);
    }
    if (mode === "remove" && dialogEngineer) {
      shiftService.removeEngineer(shift.date, shift.type, dialogEngineer, user.id);
      toast.success(`${userById(dialogEngineer)} removed from shift`);
    }
    if (mode === "note") {
      shiftService.addNote(shift.date, shift.type, dialogNote, user.id);
      toast.success("Shift note saved");
    }
    refresh();
    setEditor(null);
  };

  const openRequest = (shift: Shift) => {
    setRequestShift(shift);
    setRequestType("Shift Swap");
    setRequestTargetShift(
      nextShiftType(
        shift.type,
        shiftTypes.map((item) => item.name),
      ),
    );
    setRequestReason("");
  };

  const submitRequest = () => {
    if (!user || !requestShift) return;
    shiftRequestService.create(user.id, {
      type: requestType,
      requester: user.id,
      requestedDate: requestShift.date,
      currentShift: requestShift.type,
      requestedShift: requestTargetShift,
      reason: requestReason.trim() || "No reason provided",
    });
    toast.success("Shift request submitted for manager review");
    setRequestShift(null);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Shift Control"
        subtitle="Review roster coverage, assigned engineers, shift leads, requests and operational readiness."
      />

      {canGenerateRoster ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-primary/80">
                Schedule Builder
              </div>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Shift Roster</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setBuilderOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Wand2 className="h-4 w-4" /> Generate Roster
              </button>
              <button
                onClick={() => {
                  const shift = rows[0] ?? shiftService.listSchedule()[0];
                  if (shift) openEditor(shift, "add");
                }}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium text-primary hover:bg-secondary/80"
              >
                <PlusCircle className="h-4 w-4" /> Add Shift Manually
              </button>
              <button
                onClick={() => navigate({ to: "/import-center" })}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Database className="h-4 w-4" /> Import Roster
              </button>
              <button
                onClick={publishGeneratedRoster}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium text-primary hover:bg-secondary/80"
              >
                <ClipboardCheck className="h-4 w-4" /> Publish Roster
              </button>
              <button
                onClick={() => navigate({ to: "/admin" })}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Settings className="h-4 w-4" /> Shift Settings
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {user?.role === "engineer" || user?.role === "shift-lead" ? <ShiftClockCard /> : null}
        <KpiCard
          label="Current Shift"
          value={currentShiftType}
          sub={
            currentShift
              ? `${currentShift.engineers.length} engineers assigned today`
              : "No roster published"
          }
          icon={Clock}
          tone={currentShift?.coverageStatus === "Covered" ? "success" : "warning"}
        />
        <KpiCard
          label="Covered Shifts"
          value={coveredCount}
          sub="Within visible roster"
          icon={CircleDot}
          tone="success"
        />
        <KpiCard
          label="Needs Review"
          value={attentionCount}
          sub="Understaffed, pending or conflict"
          icon={Filter}
          tone={attentionCount ? "warning" : "success"}
        />
        <KpiCard
          label="Conflicts"
          value={conflicts.length}
          sub="Same-day double assignments"
          icon={Repeat}
          tone={conflicts.length ? "critical" : "success"}
        />
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Who is on shift now</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {today} / {currentShiftType} shift
              </p>
            </div>
            {currentShift ? (
              <StatusBadge status={currentShift.coverageStatus ?? "Pending Update"} />
            ) : null}
          </div>
          {currentShift ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {currentShift.engineers.map((engineerId) => (
                <span
                  key={engineerId}
                  className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-sm"
                >
                  {userById(engineerId)}
                  {currentShift.shiftLead === engineerId ? (
                    <span className="ml-2 text-xs text-primary">Lead</span>
                  ) : null}
                </span>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No current roster"
              text="No engineers are assigned to the current shift yet."
            />
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Upcoming shifts</h2>
          <div className="mt-3 space-y-2">
            {upcoming.length ? (
              upcoming.map((shift) => (
                <div
                  key={`${shift.date}-${shift.type}`}
                  className="rounded-md border border-border bg-background px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{shift.date}</span>
                    <StatusBadge status={shift.coverageStatus ?? "Pending Update"} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {shift.type} / Lead: {shift.shiftLead ? userById(shift.shiftLead) : "Not set"}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No upcoming shifts"
                text="Adjust filters to see more published shifts."
              />
            )}
          </div>
        </div>
      </section>

      {generatedRoster.length ? (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Generated roster preview</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Draft rows ready to review and publish.
                </p>
              </div>
              <StatusBadge status="Preview Ready" tone="info" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Day</th>
                  <th className="px-4 py-2.5">Morning</th>
                  <th className="px-4 py-2.5">Evening</th>
                  <th className="px-4 py-2.5">Night</th>
                  <th className="px-4 py-2.5">Off Engineers</th>
                  <th className="px-4 py-2.5">Coverage Status</th>
                  <th className="px-4 py-2.5">Warnings</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from(new Set(generatedRoster.map((shift) => shift.date))).map((date) => {
                  const byDate = generatedRoster.filter((shift) => shift.date === date);
                  const allAssigned = Array.from(
                    new Set(byDate.flatMap((shift) => shift.engineers)),
                  );
                  const offEngineers = activeEngineers
                    .filter((engineer) => !allAssigned.includes(engineer.id))
                    .map((engineer) => engineer.name);
                  const coverageStatus = byDate.some(
                    (shift) => shift.coverageStatus === "Understaffed",
                  )
                    ? "Understaffed"
                    : "Covered";
                  const warnings = byDate.flatMap((shift) => {
                    const list: string[] = [];
                    if (
                      shift.engineers.length <
                      (shift.type === "Morning"
                        ? builderForm.morningMinimum
                        : shift.type === "Evening"
                          ? builderForm.eveningMinimum
                          : builderForm.nightMinimum)
                    ) {
                      list.push(`${shift.type} below minimum`);
                    }
                    if (
                      builderForm.mandatoryEngineer &&
                      !shift.engineers.includes(builderForm.mandatoryEngineer) &&
                      (builderForm.mandatoryShift === "Any" ||
                        builderForm.mandatoryShift === shift.type)
                    ) {
                      list.push(`${userById(builderForm.mandatoryEngineer)} missing`);
                    }
                    return list;
                  });
                  return (
                    <tr key={date} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{date}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{dayName(date)}</td>
                      <td className="px-4 py-3 text-xs">
                        {byDate
                          .find((shift) => shift.type === "Morning")
                          ?.engineers.map((id) => userById(id))
                          .join(", ") || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {byDate
                          .find((shift) => shift.type === "Evening")
                          ?.engineers.map((id) => userById(id))
                          .join(", ") || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {byDate
                          .find((shift) => shift.type === "Night")
                          ?.engineers.map((id) => userById(id))
                          .join(", ") || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {offEngineers.slice(0, 4).join(", ") || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={coverageStatus} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {warnings.join("; ") || "No warnings"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={coverageStatus === "Covered" ? "Published" : "Pending"}
                          tone={coverageStatus === "Covered" ? "success" : "warning"}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => publishGeneratedRoster()}
                          className="rounded-md border border-border bg-secondary px-2 py-1 text-xs font-medium text-primary hover:bg-secondary/80"
                        >
                          Publish
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-4 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Roster table</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Date, day, shift type, assignment, lead, coverage status and available actions.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{visibleRows.length} shifts shown</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-2">
            <label className="relative xl:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search engineer, lead or note"
                className="w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              title="Filter start date"
              className="rounded-md border border-input bg-card px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              title="Filter end date"
              className="rounded-md border border-input bg-card px-3 py-2 text-sm"
            />
            <select
              value={shiftFilter}
              onChange={(event) => setShiftFilter(event.target.value as ShiftType | "All")}
              title="Filter by shift type"
              className="rounded-md border border-input bg-card px-3 py-2 text-sm"
            >
              {(["All", ...shiftTypes.map((item) => item.name)] as Array<ShiftType | "All">).map(
                (type) => (
                  <option key={type} value={type}>
                    {type === "All" ? "All shift types" : type}
                  </option>
                ),
              )}
            </select>
            <select
              value={engineerFilter}
              onChange={(event) => setEngineerFilter(event.target.value)}
              title="Filter by engineer"
              className="rounded-md border border-input bg-card px-3 py-2 text-sm"
            >
              <option value="All">All engineers</option>
              {activeEngineers.map((engineer) => (
                <option key={engineer.id} value={engineer.id}>
                  {engineer.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Day</th>
                <th className="px-4 py-2.5">Shift Type</th>
                <th className="px-4 py-2.5">Assigned Engineers</th>
                <th className="px-4 py-2.5">Shift Lead</th>
                <th className="px-4 py-2.5">Coverage Status</th>
                <th className="px-4 py-2.5">Notes</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleRows.map((shift) => {
                const isCurrent = shift.date === today && shift.type === currentShiftType;
                const isOwnShift = !!user && shift.engineers.includes(user.id);
                return (
                  <tr
                    key={`${shift.date}-${shift.type}`}
                    className={isCurrent ? "bg-primary/5" : "hover:bg-muted/30"}
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {shift.date}
                        {isCurrent ? <span className="text-xs text-primary">Current</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {dayName(shift.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <ShiftIcon shift={shift.type} />
                        {shift.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {shift.engineers.map((id) => (
                          <span key={id} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                            {userById(id).split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {shift.shiftLead ? userById(shift.shiftLead) : "Not set"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={shift.coverageStatus ?? "Pending Update"} />
                      {shift.coverageStatus === "Conflict" ? (
                        <div className="mt-1 text-[11px] text-critical">
                          Review duplicate assignment
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                      <span className="line-clamp-2">{shift.notes || "No notes added"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        <IconBtn
                          label="View shift details"
                          icon={Eye}
                          onClick={() => openEditor(shift, "view")}
                        />
                        {canEditRoster ? (
                          <>
                            <IconBtn
                              label="Edit shift assignment"
                              icon={Edit3}
                              onClick={() => openEditor(shift, "edit")}
                            />
                            <IconBtn
                              label="Add engineer to shift"
                              icon={UserPlus}
                              onClick={() => openEditor(shift, "add")}
                            />
                            <IconBtn
                              label="Remove engineer from shift"
                              icon={UserMinus}
                              onClick={() => openEditor(shift, "remove")}
                            />
                            <IconBtn
                              label="Add note"
                              icon={MessageSquare}
                              onClick={() => openEditor(shift, "note")}
                            />
                          </>
                        ) : null}
                        {canSubmitRequest && isOwnShift ? (
                          <IconBtn
                            label="Submit shift request"
                            icon={Repeat}
                            onClick={() => openRequest(shift)}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!visibleRows.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10">
                    <EmptyState
                      title="No shifts match these filters"
                      text="Clear a filter or search for another engineer."
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Today's Sign-in / Sign-out Log</h2>
          <span className="text-xs text-muted-foreground">{today}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 py-2.5">Engineer</th>
                <th className="px-4 py-2.5">Shift</th>
                <th className="px-4 py-2.5">Signed in</th>
                <th className="px-4 py-2.5">Signed out</th>
                <th className="px-4 py-2.5">Duration</th>
                <th className="px-4 py-2.5">Note</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shiftTypes
                .flatMap((item) => rosterFor(today, item.name))
                .map((entry) => {
                  const live = entry.signInAt && !entry.signOutAt;
                  const mins = durationMinutes(entry.signInAt, entry.signOutAt);
                  return (
                    <tr key={`${entry.userId}-${entry.shift}`}>
                      <td className="px-4 py-3 font-medium">{userById(entry.userId)}</td>
                      <td className="px-4 py-3 text-xs">{entry.shift}</td>
                      <td className="px-4 py-3 text-xs tabular-nums">{fmtTime(entry.signInAt)}</td>
                      <td className="px-4 py-3 text-xs tabular-nums">{fmtTime(entry.signOutAt)}</td>
                      <td className="px-4 py-3 text-xs tabular-nums">{fmtDuration(mins)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                        {entry.note ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={live ? "On shift" : "Completed"}
                          tone={live ? "success" : "info"}
                        />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={builderOpen} onOpenChange={(open) => !open && setBuilderOpen(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Roster</DialogTitle>
            <DialogDescription>
              Create a draft roster with mandatory engineer coverage, workday rules and minimum
              staffing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Start date
              </span>
              <input
                type="date"
                value={builderForm.startDate}
                onChange={(event) =>
                  setBuilderForm({ ...builderForm, startDate: event.target.value })
                }
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                End date
              </span>
              <input
                type="date"
                value={builderForm.endDate}
                onChange={(event) =>
                  setBuilderForm({ ...builderForm, endDate: event.target.value })
                }
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Selected engineers
              </span>
              <select
                multiple
                value={builderForm.selectedEngineers}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions, (option) => option.value);
                  setBuilderForm({ ...builderForm, selectedEngineers: values });
                }}
                className="mt-1.5 h-28 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              >
                {activeEngineers.map((engineer) => (
                  <option key={engineer.id} value={engineer.id}>
                    {engineer.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Morning minimum
              </span>
              <input
                type="number"
                min={1}
                value={builderForm.morningMinimum}
                onChange={(event) =>
                  setBuilderForm({
                    ...builderForm,
                    morningMinimum: Number(event.target.value) || 1,
                  })
                }
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Evening minimum
              </span>
              <input
                type="number"
                min={1}
                value={builderForm.eveningMinimum}
                onChange={(event) =>
                  setBuilderForm({
                    ...builderForm,
                    eveningMinimum: Number(event.target.value) || 1,
                  })
                }
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Night minimum
              </span>
              <input
                type="number"
                min={1}
                value={builderForm.nightMinimum}
                onChange={(event) =>
                  setBuilderForm({ ...builderForm, nightMinimum: Number(event.target.value) || 1 })
                }
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Work days
              </span>
              <input
                type="number"
                min={1}
                value={builderForm.workDays}
                onChange={(event) =>
                  setBuilderForm({ ...builderForm, workDays: Number(event.target.value) || 6 })
                }
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Off days
              </span>
              <input
                type="number"
                min={0}
                value={builderForm.offDays}
                onChange={(event) =>
                  setBuilderForm({ ...builderForm, offDays: Number(event.target.value) || 2 })
                }
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Mandatory engineer
              </span>
              <select
                value={builderForm.mandatoryEngineer}
                onChange={(event) =>
                  setBuilderForm({ ...builderForm, mandatoryEngineer: event.target.value })
                }
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              >
                <option value="">No mandatory engineer</option>
                {activeEngineers.map((engineer) => (
                  <option key={engineer.id} value={engineer.id}>
                    {engineer.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Mandatory rule type
              </span>
              <select
                value={builderForm.mandatoryRuleType}
                onChange={(event) =>
                  setBuilderForm({ ...builderForm, mandatoryRuleType: event.target.value })
                }
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              >
                <option value="Must be scheduled">Must be scheduled</option>
                <option value="Must be off">Must be off</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Mandatory shift
              </span>
              <select
                value={builderForm.mandatoryShift}
                onChange={(event) =>
                  setBuilderForm({
                    ...builderForm,
                    mandatoryShift: event.target.value as ShiftType,
                  })
                }
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              >
                {(["Morning", "Evening", "Night"] as ShiftType[]).map((shiftType) => (
                  <option key={shiftType} value={shiftType}>
                    {shiftType}
                  </option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Reason</span>
              <textarea
                rows={3}
                value={builderForm.reason}
                onChange={(event) => setBuilderForm({ ...builderForm, reason: event.target.value })}
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm resize-none"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              onClick={() => setBuilderOpen(false)}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={buildRosterPreview}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Generate Preview
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RosterDialog
        editor={editor}
        activeEngineers={activeEngineers}
        engineerId={dialogEngineer}
        leadId={dialogLead}
        status={dialogStatus}
        note={dialogNote}
        onEngineerChange={setDialogEngineer}
        onLeadChange={setDialogLead}
        onStatusChange={setDialogStatus}
        onNoteChange={setDialogNote}
        onClose={() => setEditor(null)}
        onSave={saveEditor}
      />

      <Dialog open={!!requestShift} onOpenChange={(open) => !open && setRequestShift(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit shift request</DialogTitle>
            <DialogDescription>
              Send a roster request to the manager or admin team for approval.
            </DialogDescription>
          </DialogHeader>
          {requestShift ? (
            <div className="space-y-3">
              <InfoRow label="Shift" value={`${requestShift.date} / ${requestShift.type}`} />
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Request type
                </span>
                <select
                  value={requestType}
                  onChange={(event) => setRequestType(event.target.value as ShiftRequest["type"])}
                  className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                >
                  {REQUEST_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Requested shift
                </span>
                <select
                  value={requestTargetShift}
                  onChange={(event) => setRequestTargetShift(event.target.value as ShiftType)}
                  className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                >
                  {shiftTypes.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Reason
                </span>
                <textarea
                  value={requestReason}
                  onChange={(event) => setRequestReason(event.target.value)}
                  rows={3}
                  placeholder="Brief reason for the request"
                  className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm resize-none"
                />
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <button
              onClick={() => setRequestShift(null)}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={submitRequest}
              className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
            >
              Submit request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RosterDialog({
  editor,
  activeEngineers,
  engineerId,
  leadId,
  status,
  note,
  onEngineerChange,
  onLeadChange,
  onStatusChange,
  onNoteChange,
  onClose,
  onSave,
}: {
  editor: { shift: Shift; mode: EditorMode } | null;
  activeEngineers: Array<{ id: string; name: string }>;
  engineerId: string;
  leadId: string;
  status: NonNullable<Shift["coverageStatus"]>;
  note: string;
  onEngineerChange: (value: string) => void;
  onLeadChange: (value: string) => void;
  onStatusChange: (value: NonNullable<Shift["coverageStatus"]>) => void;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const shift = editor?.shift;
  const mode = editor?.mode;
  const title = mode ? modeTitle(mode) : "Shift";
  const availableEngineers = shift
    ? activeEngineers.filter((engineer) => !shift.engineers.includes(engineer.id))
    : [];

  return (
    <Dialog open={!!editor} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {shift ? `${shift.date} / ${shift.type} shift` : "Roster configuration"}
          </DialogDescription>
        </DialogHeader>
        {shift ? (
          <div className="space-y-3">
            <InfoRow
              label="Assigned engineers"
              value={shift.engineers.map(userById).join(", ") || "None"}
            />
            <InfoRow
              label="Shift lead"
              value={shift.shiftLead ? userById(shift.shiftLead) : "Not set"}
            />
            <InfoRow label="Coverage" value={shift.coverageStatus ?? "Pending Update"} />
            {mode === "view" ? (
              <InfoRow label="Notes" value={shift.notes || "No notes added"} />
            ) : null}
            {mode === "edit" ? (
              <>
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Shift lead
                  </span>
                  <select
                    value={leadId}
                    onChange={(event) => onLeadChange(event.target.value)}
                    className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                  >
                    <option value="">No lead set</option>
                    {shift.engineers.map((id) => (
                      <option key={id} value={id}>
                        {userById(id)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Coverage status
                  </span>
                  <select
                    value={status}
                    onChange={(event) =>
                      onStatusChange(event.target.value as NonNullable<Shift["coverageStatus"]>)
                    }
                    className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                  >
                    {["Covered", "Understaffed", "Pending Update", "Conflict"].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
            {mode === "add" ? (
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Engineer to add
                </span>
                <select
                  value={engineerId}
                  onChange={(event) => onEngineerChange(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                >
                  {availableEngineers.length ? (
                    availableEngineers.map((engineer) => (
                      <option key={engineer.id} value={engineer.id}>
                        {engineer.name}
                      </option>
                    ))
                  ) : (
                    <option value="">All engineers already assigned</option>
                  )}
                </select>
              </label>
            ) : null}
            {mode === "remove" ? (
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Engineer to remove
                </span>
                <select
                  value={engineerId}
                  onChange={(event) => onEngineerChange(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                >
                  {shift.engineers.map((id) => (
                    <option key={id} value={id}>
                      {userById(id)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {mode === "edit" || mode === "note" ? (
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Notes
                </span>
                <textarea
                  value={note}
                  onChange={(event) => onNoteChange(event.target.value)}
                  rows={4}
                  className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm resize-none"
                />
              </label>
            ) : null}
          </div>
        ) : null}
        <DialogFooter>
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Close
          </button>
          {mode !== "view" ? (
            <button
              onClick={onSave}
              className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
            >
              Save changes
            </button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IconBtn({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-5 text-center">
      <CalendarDays className="mx-auto h-5 w-5 text-muted-foreground" />
      <div className="mt-2 text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{text}</div>
    </div>
  );
}

function dayName(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long" });
}

function ShiftIcon({ shift }: { shift: ShiftType }) {
  if (shift === "Night") return <Moon className="h-3.5 w-3.5" />;
  if (shift === "Evening") return <Sunset className="h-3.5 w-3.5" />;
  return <Sun className="h-3.5 w-3.5" />;
}

function nextShiftType(current: ShiftType, shiftTypes: ShiftType[]) {
  const index = shiftTypes.indexOf(current);
  if (index === -1) return shiftTypes[0] ?? "Morning";
  return shiftTypes[(index + 1) % shiftTypes.length] ?? "Morning";
}

function modeTitle(mode: EditorMode) {
  const titles: Record<EditorMode, string> = {
    view: "Shift details",
    edit: "Edit shift assignment",
    add: "Add engineer to shift",
    remove: "Remove engineer from shift",
    note: "Add shift note",
  };
  return titles[mode];
}
