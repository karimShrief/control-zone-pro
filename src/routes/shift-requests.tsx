import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { userById, type ShiftRequest } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { canManageShiftRequests, canSubmitShiftRequests } from "@/lib/rbac";
import { backendClient } from "@/lib/backend-client";
import { Plus, Send, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shift-requests")({
  component: ShiftRequestsPage,
});

type DraftShiftRequest = Pick<
  ShiftRequest,
  "type" | "requestedDate" | "currentShift" | "requestedShift" | "reason"
>;

const requestTypes: ShiftRequest["type"][] = [
  "Shift Swap",
  "Leave Early",
  "Change Shift",
  "Absence Note",
];
const shifts: ShiftRequest["currentShift"][] = ["Morning", "Night"];

const today = () => new Date().toISOString().slice(0, 10);

const createDraft = (): DraftShiftRequest => ({
  type: "Shift Swap",
  requestedDate: today(),
  currentShift: "Morning",
  requestedShift: "Night",
  reason: "",
});

function ShiftRequestsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ShiftRequest[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<DraftShiftRequest>(() => createDraft());
  const canSubmit = canSubmitShiftRequests(user);
  const canManage = canManageShiftRequests(user);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    try {
      const response = await backendClient.listShiftRequests();
      setRows(response.rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load shift requests");
    }
  };

  const updateDraft = <K extends keyof DraftShiftRequest>(key: K, value: DraftShiftRequest[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submitRequest = async () => {
    if (!user || !canSubmit) return;

    if (!draft.reason.trim()) {
      toast.error("Reason is required before submitting a shift request.");
      return;
    }

    try {
      const response = await backendClient.createShiftRequest(user.id, {
        ...draft,
        reason: draft.reason.trim(),
      });
      setRows(response.rows);
      setDraft(createDraft());
      setIsCreating(false);
      toast.success(`${response.request.id} submitted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit shift request");
    }
  };

  const updateStatus = async (request: ShiftRequest, status: ShiftRequest["status"]) => {
    if (!user || !canManage) return;
    try {
      const response = await backendClient.updateShiftRequestStatus(user.id, request.id, status);
      setRows(response.rows);
      toast.success(`${request.id} ${status.toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update shift request");
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Shift Requests"
        subtitle="Swaps, leave-early, change-shift and absence notes"
        actions={
          canSubmit ? (
            <button
              onClick={() => setIsCreating((current) => !current)}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
            >
              {isCreating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isCreating ? "Cancel" : "New Request"}
            </button>
          ) : null
        }
      />

      {canSubmit && isCreating && (
        <section className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <select
                value={draft.type}
                onChange={(event) =>
                  updateDraft("type", event.target.value as ShiftRequest["type"])
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
              >
                {requestTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Date</label>
              <input
                type="date"
                value={draft.requestedDate}
                onChange={(event) => updateDraft("requestedDate", event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Current Shift</label>
              <select
                value={draft.currentShift}
                onChange={(event) =>
                  updateDraft("currentShift", event.target.value as ShiftRequest["currentShift"])
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
              >
                {shifts.map((shift) => (
                  <option key={shift} value={shift}>
                    {shift}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Requested Shift</label>
              <select
                value={draft.requestedShift}
                onChange={(event) =>
                  updateDraft(
                    "requestedShift",
                    event.target.value as ShiftRequest["requestedShift"],
                  )
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
              >
                {shifts.map((shift) => (
                  <option key={shift} value={shift}>
                    {shift}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">Reason</label>
              <input
                value={draft.reason}
                onChange={(event) => updateDraft("reason", event.target.value)}
                placeholder="Why is this request needed?"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={submitRequest}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
            >
              <Send className="h-4 w-4" /> Submit Request
            </button>
          </div>
        </section>
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
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
              <th className="px-4 py-2.5">Manager</th>
              {canManage && <th className="px-4 py-2.5">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                <td className="px-4 py-3">{r.type}</td>
                <td className="px-4 py-3 text-xs">{userById(r.requester)}</td>
                <td className="px-4 py-3 text-xs">{r.requestedDate}</td>
                <td className="px-4 py-3 text-xs">{r.currentShift}</td>
                <td className="px-4 py-3 text-xs">{r.requestedShift}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.reason}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-xs">{r.managerApproval}</td>
                {canManage && (
                  <td className="px-4 py-3">
                    {r.status === "Pending" ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateStatus(r, "Approved")}
                          className="text-xs rounded border border-border px-2 py-0.5 hover:bg-muted"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(r, "Rejected")}
                          className="text-xs rounded border border-border px-2 py-0.5 hover:bg-muted"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
