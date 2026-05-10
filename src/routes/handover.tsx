import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, KpiCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { userById, type HandoverPoint } from "@/lib/mock-data";
import { canAuditHandover, canSubmitHandover } from "@/lib/rbac";
import { handoverService } from "@/lib/services";
import { Plus, ClipboardList, CheckCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/handover")({
  component: HandoverPage,
});

function HandoverPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState(() => handoverService.list());
  const [shift, setShift] = useState<"All" | "Morning" | "Night">("All");

  const canAudit = canAuditHandover(user);
  const canSubmit = canSubmitHandover(user);
  const filtered = rows.filter((h) => shift === "All" || h.shift === shift);
  const isManager = canAudit;

  const updateAudit = (handover: HandoverPoint, audit: HandoverPoint["audit"]) => {
    if (!user || !canAudit) return;
    handoverService.updateAudit(handover.id, audit, user.id);
    setRows(handoverService.list());
    toast.success(`${handover.id} marked ${audit.toLowerCase()}`);
  };

  const submitHandover = () => {
    if (!user || !canSubmit) return;
    const point = handoverService.create(user.id, shift === "Night" ? "Night" : "Morning");
    setRows(handoverService.list());
    toast.success(`${point.id} submitted`);
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
        actions={
          canSubmit && (
            <button
              onClick={submitHandover}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Submit Handover Point
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total Points" value={rows.length} icon={ClipboardList} />
        <KpiCard
          label="Acknowledged"
          value={`${Math.round((rows.filter((h) => h.acknowledged).length / rows.length) * 100)}%`}
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
            className={`text-sm rounded-md px-3 py-1.5 border ${shift === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((h) => (
          <div key={h.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{h.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {h.date} · {h.shift} shift
                  </span>
                  <StatusBadge status={h.category} tone="info" />
                  <StatusBadge status={h.priority} />
                  {h.relatedRef && (
                    <span className="text-xs text-muted-foreground">→ {h.relatedRef}</span>
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
                  <div className="flex gap-1 mt-1">
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
