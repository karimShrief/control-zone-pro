import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, KpiCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { type Role, type User } from "@/lib/mock-data";
import { userService } from "@/lib/services";
import { backendClient } from "@/lib/backend-client";
import { useAuth } from "@/lib/auth";
import { Users, ShieldCheck, Plus, Cog } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const TABS = ["Users", "Roles", "Teams", "Categories", "Shift Settings", "System"] as const;
const ROLES: Role[] = ["engineer", "manager", "executive", "admin"];
const TEAMS: NonNullable<User["team"]>[] = ["DC", "NOC", "Shared"];

const emptyDraft = {
  name: "",
  username: "",
  role: "engineer" as Role,
  team: "DC" as NonNullable<User["team"]>,
};

function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Users");
  const [rows, setRows] = useState<User[]>(() => userService.list());
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = async () => {
    try {
      const response = await backendClient.listUsers();
      setRows(response.rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load users");
    }
  };

  const createUser = async () => {
    if (!user) return;
    if (!draft.name.trim() || !draft.username.trim()) {
      toast.error("Name and username are required.");
      return;
    }

    try {
      const response = await backendClient.createUser(user.id, {
        name: draft.name.trim(),
        username: draft.username.trim(),
        role: draft.role,
        team: draft.team,
      });
      setRows(response.rows);
      setDraft(emptyDraft);
      setIsAdding(false);
      toast.success(`${response.user.name} created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create user");
    }
  };

  const updateUser = async (target: User, patch: Partial<Pick<User, "role" | "team">>) => {
    if (!user) return;
    try {
      const response = await backendClient.updateUser(user.id, target.id, patch);
      setRows(response.rows);
      toast.success(`${target.name} updated`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update user");
    }
  };

  const roleCount = (role: Role) => rows.filter((row) => row.role === role).length;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Administration"
        subtitle="Users, roles, teams, categories and system configuration"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Users" value={rows.length} icon={Users} tone="info" />
        <KpiCard
          label="Active Roles"
          value={ROLES.length}
          icon={ShieldCheck}
          sub="Engineer / Manager / Executive / Admin"
        />
        <KpiCard label="Teams" value={TEAMS.length} sub="DC / NOC / Shared" />
        <KpiCard label="Future Role" value="Shift Lead" sub="Ready to enable" tone="warning" />
      </div>

      <div className="border-b border-border mb-6 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px whitespace-nowrap ${
              tab === t
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Users" && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Users</h3>
            <button
              onClick={() => setIsAdding((current) => !current)}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> {isAdding ? "Close Form" : "Add User"}
            </button>
          </div>

          {isAdding && (
            <div className="border-b border-border bg-muted/20 p-4">
              <div className="grid gap-3 md:grid-cols-5">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, name: event.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Username</label>
                  <input
                    value={draft.username}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, username: event.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Role</label>
                  <select
                    value={draft.role}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, role: event.target.value as Role }))
                    }
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Team</label>
                  <select
                    value={draft.team}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        team: event.target.value as NonNullable<User["team"]>,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                  >
                    {TEAMS.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={createUser}
                    className="w-full rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"
                  >
                    Create User
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Mock users use the demo password until real authentication is connected.
              </p>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Username</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Team</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.username}</td>
                  <td className="px-4 py-3">
                    <select
                      value={row.role}
                      onChange={(event) => updateUser(row, { role: event.target.value as Role })}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-xs uppercase tracking-wider"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.team ?? "Shared"}
                      onChange={(event) =>
                        updateUser(row, { team: event.target.value as User["team"] })
                      }
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                    >
                      {TEAMS.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status="Approved" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              role: "Engineer",
              count: roleCount("engineer"),
              desc: "Operational front-line: executes work and submits handover",
            },
            {
              role: "Manager",
              count: roleCount("manager"),
              desc: "Command view: assigns work, audits handover and approvals",
            },
            { role: "Executive", count: roleCount("executive"), desc: "Read-only KPI dashboards" },
            {
              role: "Admin",
              count: roleCount("admin"),
              desc: "System configuration and user lifecycle",
            },
            { role: "Shift Lead", count: 0, desc: "Future role currently disabled" },
          ].map((r) => (
            <div key={r.role} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{r.role}</h3>
                <StatusBadge status={r.count === 0 ? "Pending" : "Approved"} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              <div className="text-xs text-muted-foreground mt-3">{r.count} users</div>
            </div>
          ))}
        </div>
      )}

      {tab === "Teams" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TEAMS.map((team) => (
            <div key={team} className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold">{team} Team</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rows
                  .filter((row) => row.team === team)
                  .map((row) => (
                    <span key={row.id} className="text-xs rounded-full bg-muted px-2 py-0.5">
                      {row.name.split(" ")[0]}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(tab === "Categories" || tab === "Shift Settings" || tab === "System") && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Cog className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold">{tab}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configuration UI for {tab.toLowerCase()} - mock placeholder.
          </p>
        </div>
      )}
    </div>
  );
}
