import { Link, Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { landingFor, useAuth } from "@/lib/auth";
import { canAccessPath } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  ListChecks,
  AlertTriangle,
  FolderKanban,
  CalendarDays,
  Repeat,
  ClipboardList,
  BookOpen,
  BarChart3,
  FileText,
  ShieldCheck,
  LogOut,
  Activity,
  Search,
  Bell,
  ChevronLeft,
  ChevronDown,
  LogIn,
  Monitor,
  Moon,
  Sun,
  Upload,
  UserCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { systemConfigService } from "@/lib/services";
import {
  roleConfigs,
  systemSettings,
  type AdminModule,
  type Role,
  type SystemSettings,
} from "@/lib/data";

interface NavItem {
  to: string;
  label: string;
  module: AdminModule;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const NAV: NavItem[] = [
  {
    to: "/dashboard",
    label: "Command View",
    module: "Dashboard",
    icon: LayoutDashboard,
    roles: ["manager", "executive", "admin"],
  },
  {
    to: "/my-work",
    label: "My Work",
    module: "My Work",
    icon: Briefcase,
    roles: ["engineer", "shift-lead"],
  },
  {
    to: "/tasks",
    label: "Daily Operations",
    module: "Tasks",
    icon: ListChecks,
    roles: ["engineer", "shift-lead", "manager", "admin"],
  },
  {
    to: "/incidents",
    label: "Incident Control",
    module: "Incidents",
    icon: AlertTriangle,
    roles: ["engineer", "shift-lead", "manager", "executive", "admin"],
  },
  {
    to: "/projects",
    label: "Projects & Readiness",
    module: "Projects",
    icon: FolderKanban,
    roles: ["engineer", "shift-lead", "manager", "executive", "admin"],
  },
  {
    to: "/shifts",
    label: "Shift Control",
    module: "Shift Roster",
    icon: CalendarDays,
    roles: ["engineer", "shift-lead", "manager", "executive", "admin"],
  },
  {
    to: "/shift-requests",
    label: "Shift Requests",
    module: "Shift Requests",
    icon: Repeat,
    roles: ["engineer", "shift-lead", "manager", "admin"],
  },
  {
    to: "/handover",
    label: "Handover Quality",
    module: "Handover",
    icon: ClipboardList,
    roles: ["engineer", "shift-lead", "manager", "admin"],
  },
  {
    to: "/sop",
    label: "SOP Library",
    module: "SOP Library",
    icon: BookOpen,
    roles: ["engineer", "shift-lead", "manager", "executive", "admin"],
  },
  {
    to: "/import-center",
    label: "Import Center",
    module: "Import Center",
    icon: Upload,
    roles: ["shift-lead", "manager", "executive", "admin"],
  },
  {
    to: "/productivity",
    label: "Team Productivity",
    module: "Productivity",
    icon: BarChart3,
    roles: ["manager", "executive", "admin"],
  },
  {
    to: "/reports",
    label: "Reports",
    module: "Reports",
    icon: FileText,
    roles: ["shift-lead", "manager", "executive", "admin"],
  },
  {
    to: "/admin",
    label: "Configuration Center",
    module: "Admin",
    icon: ShieldCheck,
    roles: ["admin"],
  },
];

const THEME_EVENT = "ops-system-settings-changed";
const THEME_OPTIONS: SystemSettings["themePreference"][] = ["Light", "Dark"];

function isDarkPreference(theme: SystemSettings["themePreference"]) {
  if (theme === "Dark") return true;
  if (theme === "Light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyThemePreference(theme: SystemSettings["themePreference"]) {
  if (typeof document === "undefined") return;
  const isDark = isDarkPreference(theme);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

function nextThemePreference(theme: SystemSettings["themePreference"]) {
  const currentIndex = THEME_OPTIONS.indexOf(theme);
  return THEME_OPTIONS[(currentIndex + 1) % THEME_OPTIONS.length];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [themePreference, setThemePreference] = useState<SystemSettings["themePreference"]>(
    systemSettings.themePreference,
  );

  useEffect(() => {
    applyThemePreference(themePreference);
    if (themePreference !== "System" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => applyThemePreference("System");
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, [themePreference]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncSettingsTheme = () => setThemePreference(systemSettings.themePreference);
    window.addEventListener(THEME_EVENT, syncSettingsTheme);
    return () => window.removeEventListener(THEME_EVENT, syncSettingsTheme);
  }, []);

  if (!user) {
    if (path !== "/login") return <Navigate to="/login" />;
    return <>{children}</>;
  }

  if (!canAccessPath(user, path)) {
    if (path.startsWith("/import-center")) return <PermissionDenied />;
    return <Navigate to={landingFor(user.role)} />;
  }

  const roleConfig = roleConfigs.find((role) => role.id === user.role);
  const items = NAV.filter(
    (n) =>
      n.roles.includes(user.role) &&
      systemSettings.enabledModules.includes(n.module) &&
      (roleConfig?.modules.includes(n.module) ?? true),
  );
  const ThemeIcon = themePreference === "Dark" ? Moon : themePreference === "Light" ? Sun : Monitor;

  const cycleThemePreference = () => {
    const next = nextThemePreference(themePreference);
    systemConfigService.update(user.id, { themePreference: next });
    setThemePreference(next);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="flex w-[17rem] flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl shadow-sidebar/10">
        <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Nerve Center</div>
            <div className="text-[11px] text-sidebar-foreground/60 uppercase tracking-wider">
              DC &amp; NOC Operations Intelligence
            </div>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
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
              {user.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
                {user.role}
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
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
        <header className="sticky top-0 z-20 h-16 flex items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur">
          <div className="flex flex-1 max-w-md items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search work, incidents, projects, SOPs..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Service Availability Normal
            </div>
            <button className="relative rounded-md p-2 hover:bg-muted text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-critical" />
            </button>
            <button
              onClick={cycleThemePreference}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-xs text-foreground hover:bg-muted"
              title={`Theme: ${themePreference}. Click to change.`}
            >
              <ThemeIcon className="h-4 w-4 text-muted-foreground" />
              <span className="hidden lg:inline">{themePreference}</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-sm hover:bg-muted">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
                  {user.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-xs font-medium">{user.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {user.role}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  Signed in as <span className="font-semibold">{user.username}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserCircle2 className="h-4 w-4 mr-2" /> My profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/login" })}>
                  <LogIn className="h-4 w-4 mr-2" /> Switch user
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate({ to: "/login" });
                  }}
                  className="text-critical focus:text-critical"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function PermissionDenied() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fallbackPath = user ? landingFor(user.role) : "/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Permission denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Import Center is restricted to Shift Lead, Manager, Executive and Admin roles.
        </p>
        <button
          onClick={() => navigate({ to: fallbackPath })}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Return to my workspace
        </button>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  showBack = true,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBack?: boolean;
}) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const fallbackPath = user ? landingFor(user.role) : "/login";
  const canGoBack = showBack && path !== fallbackPath && path !== "/login";

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({ to: fallbackPath });
  };

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex min-w-0 items-start gap-3">
        {canGoBack ? (
          <button
            onClick={goBack}
            className="mt-0.5 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Go back"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "neutral" | "success" | "warning" | "critical" | "info";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneText = {
    neutral: "text-foreground",
    success: "text-success",
    warning: "text-warning-foreground",
    critical: "text-critical",
    info: "text-info",
  }[tone];
  const toneBg = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    critical: "bg-critical/15 text-critical",
    info: "bg-info/15 text-info",
  }[tone];
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </div>
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