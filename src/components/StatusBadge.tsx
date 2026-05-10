import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "critical" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/20 text-warning-foreground border-warning/40",
  critical: "bg-critical/15 text-critical border-critical/30",
  info: "bg-info/15 text-info border-info/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

const map: Record<string, Tone> = {
  // generic
  Completed: "success",
  Done: "success",
  Resolved: "success",
  Closed: "success",
  Approved: "success",
  "On Track": "success",
  "In Progress": "info",
  Accepted: "info",
  Active: "info",
  Assigned: "info",
  Monitoring: "info",
  Review: "info",
  New: "neutral",
  "To Do": "neutral",
  Planning: "neutral",
  Open: "neutral",
  Pending: "warning",
  "Pending Team": "warning",
  "Pending Approval": "warning",
  "Waiting Vendor": "warning",
  "Waiting Network Team": "warning",
  "Waiting Access": "warning",
  "Waiting Approval": "warning",
  "At Risk": "warning",
  "On Hold": "warning",
  "Needs Update": "warning",
  "In Review": "warning",
  Draft: "warning",
  Escalated: "critical",
  Blocked: "critical",
  Breached: "critical",
  Cancelled: "neutral",
  Unassigned: "warning",
  Rejected: "critical",
  "SEV-1": "critical",
  "SEV-2": "critical",
  "SEV-3": "warning",
  "SEV-4": "info",
  Critical: "critical",
  High: "warning",
  Medium: "info",
  Low: "neutral",
};

export function StatusBadge({
  status,
  tone,
  className,
}: {
  status: string;
  tone?: Tone;
  className?: string;
}) {
  const t = tone ?? map[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[t],
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-success": t === "success",
          "bg-warning": t === "warning",
          "bg-critical": t === "critical",
          "bg-info": t === "info",
          "bg-muted-foreground": t === "neutral",
        })}
      />
      {status}
    </span>
  );
}
