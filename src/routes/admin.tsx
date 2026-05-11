import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, KpiCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { users } from "@/lib/mock-data";
import { Users, ShieldCheck, Settings, Plus, Cog } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const TABS = ["Users", "Roles", "Teams", "Categories", "Shift Settings", "System"] as const;

function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Users");

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Administration"
        subtitle="Users, roles, teams, categories and system configuration"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Users" value={users.length} icon={Users} tone="info" />
        <KpiCard
          label="Active Roles"
          value={4}
          icon={ShieldCheck}
          sub="Engineer · Manager · Executive · Admin"
        />
        <KpiCard label="Teams" value={3} sub="DC · NOC · Shared" />
        <KpiCard label="Future Role" value="Shift Lead" sub="Ready to enable" tone="warning" />
      </div>

      <div className="border-b border-border mb-6 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px whitespace-nowrap ${tab === t ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Users" && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Users</h3>
            <button className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Add User
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Username</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Team</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wider">{u.role}</td>
                  <td className="px-4 py-3 text-xs">{u.team ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status="Approved" />
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-primary hover:underline">Edit</button>
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
              count: 6,
              desc: "Operational front-line · executes work, submits handover",
            },
            {
              role: "Manager",
              count: 1,
              desc: "Command view · assigns work, audits handover and approvals",
            },
            { role: "Executive", count: 1, desc: "Read-only KPI dashboards" },
            { role: "Admin", count: 1, desc: "System configuration and user lifecycle" },
            { role: "Shift Lead", count: 0, desc: "Future role — currently disabled" },
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
          {["DC", "NOC", "Shared"].map((t) => (
            <div key={t} className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold">{t} Team</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {users
                  .filter((u) => u.team === t)
                  .map((u) => (
                    <span key={u.id} className="text-xs rounded-full bg-muted px-2 py-0.5">
                      {u.name.split(" ")[0]}
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
            Configuration UI for {tab.toLowerCase()} — mock placeholder.
          </p>
        </div>
      )}
    </div>
  );
}
