import { Link, createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { tasks, incidents, projects, shifts, handoverPoints } from "@/lib/data";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  Gauge,
  ListChecks,
  MonitorCog,
  NotebookPen,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

type RoleKey = "engineer" | "shift-lead" | "manager" | "executive" | "admin";

type ActionCard = {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
};

function Dashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case "engineer":
      return <RoleDashboard role="engineer" />;
    case "shift-lead":
      return <RoleDashboard role="shift-lead" />;
    case "manager":
      return <RoleDashboard role="manager" />;
    case "admin":
      return <RoleDashboard role="admin" />;
    default:
      return <RoleDashboard role="executive" />;
  }
}

function RoleDashboard({ role }: { role: RoleKey }) {
  const today = new Date().toISOString().slice(0, 10);
  const todaysShiftCoverage = shifts.filter((shift) => shift.date === today);
  const coverageReady = todaysShiftCoverage.some((shift) => shift.engineers.length >= 3);
  const openCritical = tasks.filter(
    (task) => task.status === "Blocked" || task.status === "Escalated" || task.sla === "Breached",
  ).length;
  const incidentRisk = incidents.filter(
    (incident) => incident.severity === "SEV-1" || incident.sla !== "On Track",
  ).length;
  const handoverReview = handoverPoints.filter((point) => !point.acknowledged).length;
  const actionCards = getRoleActions(role);
  const roleLine = getRoleLine(role);

  const briefCards = [
    {
      label: "Current shift status",
      value: coverageReady
        ? "Shift coverage is ready for the current plan."
        : "Coverage review is needed before the next changeover.",
    },
    {
      label: "Critical attention",
      value:
        openCritical || incidentRisk
          ? "Active operational items need a prompt review by the relevant team."
          : "No critical operational blockers detected in mock mode.",
    },
    {
      label: "Handover review",
      value:
        handoverReview > 0
          ? `${handoverReview} handover item${handoverReview === 1 ? "" : "s"} still need review.`
          : "Handover quality is clear and ready for the next shift.",
    },
    {
      label: "Suggested next action",
      value:
        role === "engineer"
          ? "Review your assigned tasks and update your work before the next shift handover."
          : role === "shift-lead"
            ? "Check active incidents and the upcoming shift coverage before publishing handover updates."
            : role === "manager"
              ? "Assign outstanding work, review incident risk, and confirm shift readiness."
              : role === "admin"
                ? "Validate governance settings, templates, and operational rules before the next changeover."
                : "Review readiness, critical risk areas, and productivity trends for the current period.",
    },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader title="DC & NOC Operations Intelligence" subtitle="Nerve Center" />

      <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,rgba(136,143,116,0.12),rgba(245,238,223,0.86),rgba(255,255,255,0.95))] p-6 shadow-[0_10px_30px_rgba(18,40,34,0.08)] dark:bg-[linear-gradient(135deg,rgba(20,29,25,0.95),rgba(32,42,38,0.96),rgba(18,22,19,0.98))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-900/30 bg-emerald-950/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-900 dark:text-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Operational command entry
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-emerald-950 dark:text-emerald-50 md:text-5xl">
              DC & NOC Operations Intelligence
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-emerald-950/78 dark:text-emerald-100/80">
              A shift-aware workspace for tracking incidents, tasks, handovers, roster readiness,
              SOPs, and operational decisions across the data center and NOC.
            </p>
            <p className="mt-4 text-sm text-emerald-900/80 dark:text-emerald-100/80">{roleLine}</p>
          </div>

          <div className="rounded-xl border border-emerald-900/15 bg-white/60 p-4 text-sm text-emerald-950 shadow-sm backdrop-blur-sm dark:bg-emerald-950/20 dark:text-emerald-50">
            <div className="text-[11px] uppercase tracking-[0.16em] text-emerald-900/60 dark:text-emerald-100/60">
              Today’s operating focus
            </div>
            <div className="mt-2 font-medium">
              {coverageReady
                ? "Readiness is stable across the active shift."
                : "Shift readiness requires attention before the next transition."}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Role actions
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Start with the right operational action
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {actionCards.map(({ title, description, to, icon: Icon }) => (
            <Link
              key={title}
              to={to}
              className="group rounded-xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-700/30 hover:bg-[linear-gradient(180deg,rgba(243,237,224,0.85),rgba(255,255,255,0.98))] dark:hover:bg-[linear-gradient(180deg,rgba(28,34,31,0.96),rgba(20,25,23,0.98))]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-900 text-emerald-50 dark:bg-emerald-800">
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-base font-semibold text-foreground">{title}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-emerald-900 dark:text-emerald-100">
                Open action{" "}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Operational brief
            </div>
            <h2 className="text-xl font-semibold text-foreground">Today’s Operational Brief</h2>
          </div>
          <div className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {today}
          </div>
        </div>

        {openCritical || incidentRisk || handoverReview > 0 || !coverageReady ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {briefCards.map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-background/80 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </div>
                <div className="mt-2 text-sm leading-6 text-foreground">{value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm leading-6 text-muted-foreground">
            No critical operational blockers detected in mock mode. Use the action cards above to
            create tasks, report incidents, or review shift coverage.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Secondary snapshot
            </div>
            <h2 className="text-xl font-semibold text-foreground">Current operational snapshot</h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryTile
            label="Open work"
            value={tasks.filter((task) => !["Completed", "Cancelled"].includes(task.status)).length}
            icon={ListChecks}
          />
          <SummaryTile
            label="Incident risk"
            value={
              incidents.filter((item) => item.sla !== "On Track" || item.severity === "SEV-1")
                .length
            }
            icon={AlertTriangle}
          />
          <SummaryTile
            label="Shift coverage"
            value={
              todaysShiftCoverage.length
                ? `${todaysShiftCoverage.length} active`
                : "Awaiting roster"
            }
            icon={Users}
          />
          <SummaryTile
            label="Handover review"
            value={handoverPoints.filter((item) => !item.acknowledged).length}
            icon={ClipboardList}
          />
        </div>
      </section>
    </div>
  );
}

function getRoleLine(role: RoleKey) {
  switch (role) {
    case "engineer":
      return "Your workspace for assigned work, shift incidents, handover updates, and SOP guidance.";
    case "shift-lead":
      return "Your shift control point for team tasks, incidents, validation, and handover quality.";
    case "manager":
      return "Your control layer for assigning work, reviewing incidents, planning coverage, and monitoring readiness.";
    case "executive":
      return "Your read-only operational brief for service health, risk, and team productivity.";
    default:
      return "Your configuration center for users, permissions, rules, templates, and platform governance.";
  }
}

function getRoleActions(role: RoleKey): ActionCard[] {
  switch (role) {
    case "engineer":
      return [
        {
          title: "My Assigned Work",
          description: "Review and update your active tasks.",
          to: "/my-work",
          icon: ListChecks,
        },
        {
          title: "Report Shift Incident",
          description: "Log critical events from your shift.",
          to: "/incidents",
          icon: AlertTriangle,
        },
        {
          title: "Submit Handover",
          description: "Capture updates for the next shift.",
          to: "/handover",
          icon: NotebookPen,
        },
        {
          title: "Open SOP Library",
          description: "Find runbooks and operational guidance.",
          to: "/sop",
          icon: FileText,
        },
      ];
    case "shift-lead":
      return [
        {
          title: "Review Shift Work",
          description: "Check team tasks and active incidents.",
          to: "/shifts",
          icon: Activity,
        },
        {
          title: "Validate Handover",
          description: "Review and comment on shift handover events.",
          to: "/handover",
          icon: NotebookPen,
        },
        {
          title: "Escalate Incident",
          description: "Review critical incidents and next actions.",
          to: "/incidents",
          icon: AlertTriangle,
        },
        {
          title: "Check Shift Coverage",
          description: "View current and upcoming shift readiness.",
          to: "/shifts",
          icon: Users,
        },
      ];
    case "manager":
      return [
        {
          title: "Assign Operational Work",
          description: "Create and assign tasks with clear details.",
          to: "/tasks",
          icon: BriefcaseBusiness,
        },
        {
          title: "Review Incidents",
          description: "Comment, review, and track critical incidents.",
          to: "/incidents",
          icon: AlertTriangle,
        },
        {
          title: "Plan Shift Coverage",
          description: "Generate and publish roster plans.",
          to: "/shifts",
          icon: Gauge,
        },
        {
          title: "Review Handover Quality",
          description: "Audit shift updates and pending actions.",
          to: "/handover",
          icon: ClipboardList,
        },
      ];
    case "executive":
      return [
        {
          title: "View Operational Brief",
          description: "Review high-level service health and readiness.",
          to: "/dashboard",
          icon: Activity,
        },
        {
          title: "Review Productivity",
          description: "Track team output and operational trends.",
          to: "/productivity",
          icon: Users,
        },
        {
          title: "Check Risk Areas",
          description: "See critical incidents and coverage risks.",
          to: "/projects",
          icon: AlertTriangle,
        },
        {
          title: "Read Reports",
          description: "Access read-only operational reports.",
          to: "/reports",
          icon: FileText,
        },
      ];
    default:
      return [
        {
          title: "Configure Platform",
          description: "Manage users, roles, permissions, and settings.",
          to: "/admin",
          icon: MonitorCog,
        },
        {
          title: "Manage Rules",
          description: "Configure roster, task, incident, and handover rules.",
          to: "/admin",
          icon: Wrench,
        },
        {
          title: "Review Audit Logs",
          description: "Track administrative and operational changes.",
          to: "/admin",
          icon: FileText,
        },
        {
          title: "Manage Templates",
          description: "Configure task, incident, project, SOP, and import templates.",
          to: "/admin",
          icon: ClipboardList,
        },
      ];
  }
}

function SummaryTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/80 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
