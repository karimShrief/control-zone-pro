import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { shiftRequests, userById } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/shift-requests")({
  component: ShiftRequestsPage,
});

function ShiftRequestsPage() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Shift Requests"
        subtitle="Swaps, leave-early, change-shift and absence notes"
        actions={<button className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"><Plus className="h-4 w-4" /> New Request</button>}
      />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
              <th className="px-4 py-2.5">ID</th><th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Requester</th><th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Current</th><th className="px-4 py-2.5">Requested</th>
              <th className="px-4 py-2.5">Reason</th><th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Manager</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shiftRequests.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                <td className="px-4 py-3">{r.type}</td>
                <td className="px-4 py-3 text-xs">{userById(r.requester)}</td>
                <td className="px-4 py-3 text-xs">{r.requestedDate}</td>
                <td className="px-4 py-3 text-xs">{r.currentShift}</td>
                <td className="px-4 py-3 text-xs">{r.requestedShift}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.reason}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-xs">{r.managerApproval}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
