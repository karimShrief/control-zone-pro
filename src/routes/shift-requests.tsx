import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { userById, type ShiftRequest, type ShiftType } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { canManageShiftRequests, canSubmitShiftRequests } from "@/lib/rbac";
import { shiftRequestService, shiftService } from "@/lib/services";
import { CheckCircle2, Plus, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/shift-requests")({
  component: ShiftRequestsPage,
});

const REQUEST_TYPES: ShiftRequest["type"][] = [
  "Shift Swap",
  "Leave Early",
  "Change Shift",
  "Absence Note",
];

function ShiftRequestsPage() {
  const { user } = useAuth();
  const shiftTypes = shiftService.listShiftTypes().filter((shiftType) => shiftType.enabled);
  const [rows, setRows] = useState(() => shiftRequestService.list());
  const [statusFilter, setStatusFilter] = useState<ShiftRequest["status"] | "All">("All");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [requestType, setRequestType] = useState<ShiftRequest["type"]>("Shift Swap");
  const [requestDate, setRequestDate] = useState(new Date().toISOString().slice(0, 10));
  const [currentShift, setCurrentShift] = useState<ShiftType>("Morning");
  const [requestedShift, setRequestedShift] = useState<ShiftType>("Night");
  const [reason, setReason] = useState("");
  const canSubmit = canSubmitShiftRequests(user);
  const canManage = canManageShiftRequests(user);
  const canReviewShiftLead = !!user && ["shift-lead", "admin"].includes(user.role);
  const canReviewManager = !!user && ["manager", "admin"].includes(user.role);

  const refresh = () => setRows(shiftRequestService.list());

  const updateStatus = (request: ShiftRequest, status: ShiftRequest["status"]) => {
    if (!user || !canManage) return;
    shiftRequestService.updateStatus(request.id, status, user.id);
    refresh();
    toast.success(`${request.id} ${status.toLowerCase()}`);
  };

  const submitRequest = () => {
    if (!user || !canSubmit) return;
    const created = shiftRequestService.create(user.id, {
      type: requestType,
      requester: user.id,
      requestedDate: requestDate,
      currentShift,
      requestedShift,
      reason: reason.trim() || "No reason provided",
    });
    refresh();
    setOpen(false);
    setReason("");
    toast.success(`${created.id} submitted`);
  };

  const visibleRows = useMemo(() => {
    return rows.filter((request) => {
      if (!canManage && request.requester !== user?.id) return false;
      if (statusFilter !== "All" && request.status !== statusFilter) return false;
      const haystack =
        `${request.id} ${request.type} ${userById(request.requester)} ${request.reason} ${request.status}`.toLowerCase();
      if (search.trim() && !haystack.includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [canManage, rows, search, statusFilter, user?.id]);

  const pendingCount = rows.filter((request) => request.status === "Pending").length;
  const approvedCount = rows.filter((request) => request.status === "Approved").length;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Shift Requests"
        subtitle="Submit, review, approve or reject shift swap, leave early, change shift and absence requests."
        actions={
          canSubmit ? (
            <button
              onClick={() => {
                const currentType = shiftService.currentShiftType();
                setCurrentShift(currentType);
                setRequestedShift(
                  nextShiftType(
                    currentType,
                    shiftTypes.map((item) => item.name),
                  ),
                );
                setOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> New Request
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard label="Pending Review" value={pendingCount} />
        <SummaryCard label="Approved" value={approvedCount} />
        <SummaryCard label="Visible Requests" value={visibleRows.length} />
      </div>

      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-4 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-2">
          <label className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search requests by ID, engineer, reason or status"
              className="w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as ShiftRequest["status"] | "All")
            }
            className="rounded-md border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Requester</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Current</th>
                <th className="px-4 py-2.5">Requested</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Shift Lead</th>
                <th className="px-4 py-2.5">Manager</th>
                {canManage && <th className="px-4 py-2.5">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleRows.map((request) => (
                <tr key={request.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {request.id}
                  </td>
                  <td className="px-4 py-3">{request.type}</td>
                  <td className="px-4 py-3 text-xs">{userById(request.requester)}</td>
                  <td className="px-4 py-3 text-xs">{request.requestedDate}</td>
                  <td className="px-4 py-3 text-xs">{request.currentShift}</td>
                  <td className="px-4 py-3 text-xs">{request.requestedShift}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                    {request.reason}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-4 py-3 text-xs">{request.shiftLeadApproval}</td>
                  <td className="px-4 py-3 text-xs">{request.managerApproval}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      {request.status === "Pending" ? (
                        <div className="flex flex-wrap gap-1">
                          {(canReviewShiftLead || canReviewManager) && (
                            <button
                              title={canReviewShiftLead ? "Shift lead review" : "Manager review"}
                              onClick={() => updateStatus(request, "Approved")}
                              className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 py-1 text-xs text-success hover:bg-success/15"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {canReviewShiftLead && !canReviewManager
                                ? "Shift Lead Approve"
                                : "Approve"}
                            </button>
                          )}
                          {(canReviewShiftLead || canReviewManager) && (
                            <button
                              title="Reject request without roster changes"
                              onClick={() => updateStatus(request, "Rejected")}
                              className="inline-flex items-center gap-1 rounded-md border border-critical/30 bg-critical/10 px-2 py-1 text-xs text-critical hover:bg-critical/15"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No action</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {!visibleRows.length ? (
                <tr>
                  <td colSpan={canManage ? 10 : 9} className="px-4 py-10 text-center">
                    <div className="text-sm font-medium">No shift requests found</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      New requests will appear here after engineers submit them.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New shift request</DialogTitle>
            <DialogDescription>
              Keep the request short. Managers can approve or reject it from this queue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
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
                Requested date
              </span>
              <input
                type="date"
                value={requestDate}
                onChange={(event) => setRequestDate(event.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Current shift
                </span>
                <select
                  value={currentShift}
                  onChange={(event) => setCurrentShift(event.target.value as ShiftType)}
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
                  Requested shift
                </span>
                <select
                  value={requestedShift}
                  onChange={(event) => setRequestedShift(event.target.value as ShiftType)}
                  className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                >
                  {shiftTypes.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Reason</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                placeholder="Short request reason"
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm resize-none"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function nextShiftType(current: ShiftType, shiftTypes: ShiftType[]) {
  const index = shiftTypes.indexOf(current);
  if (index === -1) return shiftTypes[0] ?? "Morning";
  return shiftTypes[(index + 1) % shiftTypes.length] ?? "Morning";
}
