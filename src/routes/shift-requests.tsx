import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { userById, type ShiftRequest } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { canManageShiftRequests, canSubmitShiftRequests } from "@/lib/rbac";
import { shiftRequestService } from "@/lib/services";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shift-requests")({
  component: ShiftRequestsPage,
});

function ShiftRequestsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState(() => shiftRequestService.list());
  const canSubmit = canSubmitShiftRequests(user);
  const canManage = canManageShiftRequests(user);

  const refresh = () => setRows(shiftRequestService.list());

  const updateStatus = (request: ShiftRequest, status: ShiftRequest["status"]) => {
    if (!user || !canManage) return;
    shiftRequestService.updateStatus(request.id, status, user.id);
    refresh();
    toast.success(`${request.id} ${status.toLowerCase()}`);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Shift Requests"
        subtitle="Swaps, leave-early, change-shift and absence notes"
        actions={
          canSubmit ? (
            <button className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90">
              <Plus className="h-4 w-4" /> New Request
            </button>
          ) : null
        }
      />

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
                      <span className="text-xs text-muted-foreground">—</span>
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
