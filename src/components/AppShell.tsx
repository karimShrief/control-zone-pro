import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, ListChecks, AlertTriangle, FolderKanban,
  CalendarDays, Repeat, ClipboardList, BookOpen, BarChart3, FileText,
  ShieldCheck, LogOut, Activity, Search, Bell, ChevronDown, LogIn, UserCircle2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/mock-data";

interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: Role[]; }

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["manager", "executive", "admin"] },
  { to: "/my-work", label: "My Work", icon: Briefcase, roles: ["engineer"] },
  { to: "/tasks", label: "Tasks", icon: ListChecks, roles: ["engineer", "manager", "admin"] },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle, roles: ["engineer", "manager", "executive", "admin"] },
  { to: "/projects", label: "Projects", icon: FolderKanban, roles: ["engineer", "manager", "executive", "admin"] },
  { to: "/shifts", label: "Shift Schedule", icon: CalendarDays, roles: ["engineer", "manager", "admin"] },
  { to: "/shift-requests", label: "Shift Requests", icon: Repeat, roles: ["engineer", "manager", "admin"] },
  { to: "/handover", label: "Handover", icon: ClipboardList, roles: ["engineer", "manager", "admin"] },
  { to: "/sop", label: "SOP Library", icon: BookOpen, roles: ["engineer", "manager", "executive", "admin"] },
  { to: "/productivity", label: "Team Productivity", icon: BarChart3, roles: ["manager", "executive", "admin"] },
  { to: "/reports", label: "Reports", icon: FileText, roles: ["manager", "executive", "admin"] },
  { to: "/admin", label: "Admin", icon: ShieldCheck, roles: ["admin"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (!user) return <>{children}</>;

  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Ops Command</div>
            <div className="text-[11px] text-sidebar-foreground/60 uppercase tracking-wider">DC · NOC Platform</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {items.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary/30 text-sidebar-foreground text-xs font-semibold">
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">{user.role}</div>
            </div>
            <button
              onClick={() => { logout(); navigate({ to: "/login" }); }}
              className="rounded p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search tasks, incidents, projects, SOPs…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              All Systems Operational
            </div>
            <button className="relative rounded-md p-2 hover:bg-muted text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-critical" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function KpiCard({
  label, value, sub, tone = "neutral", icon: Icon,
}: {
  label: string; value: string | number; sub?: string;
  tone?: "neutral" | "success" | "warning" | "critical" | "info";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneText = {
    neutral: "text-foreground", success: "text-success",
    warning: "text-warning-foreground", critical: "text-critical", info: "text-info",
  }[tone];
  const toneBg = {
    neutral: "bg-muted text-muted-foreground", success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground", critical: "bg-critical/15 text-critical",
    info: "bg-info/15 text-info",
  }[tone];
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
          <div className={cn("text-2xl font-semibold mt-1.5", toneText)}>{value}</div>
          {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        </div>
        {Icon && (
          <div className={cn("h-9 w-9 rounded-md flex items-center justify-center", toneBg)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
