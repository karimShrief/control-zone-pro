import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { ShiftClockCard } from "@/components/ShiftClockCard";
import { shifts, userById } from "@/lib/mock-data";
import { useShiftClock, fmtTime, fmtDuration, durationMinutes } from "@/lib/shift-clock";
import { Sun, Moon, LogIn, LogOut, CircleDot } from "lucide-react";

export const Route = createFileRoute("/shifts")({
  component: ShiftsPage,
});

function ShiftsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const dates = Array.from(new Set(shifts.map((s) => s.date))).sort();
  const { rosterFor } = useShiftClock();

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Shift Schedule" subtitle="Morning and Night shifts · clock in/out and live roster" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-1">
          <ShiftClockCard />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["Morning", "Night"] as const).map((type) => {
            const todays = shifts.find((s) => s.date === today && s.type === type);
            const roster = rosterFor(today, type);
            const onShift = roster.filter((r) => r.signInAt && !r.signOutAt).length;
            return (
              <div key={type} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {type === "Morning" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {type} shift
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 text-success px-2 py-0.5 text-xs font-medium">
                    <CircleDot className="h-3 w-3" /> {onShift} on shift
                  </span>
                </div>
                <div className="space-y-1.5">
                  {todays?.engineers.map((id) => {
                    const r = roster.find((x) => x.userId === id);
                    const isOn = r?.signInAt && !r?.signOutAt;
                    const isDone = r?.signInAt && r?.signOutAt;
                    return (
                      <div key={id} className="flex items-center justify-between text-sm rounded-md border border-border bg-background px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${isOn ? "bg-success animate-pulse" : isDone ? "bg-info" : "bg-muted-foreground/40"}`} />
                          {userById(id)}
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {r?.signInAt ? `${fmtTime(r.signInAt)} → ${r.signOutAt ? fmtTime(r.signOutAt) : "live"}` : "Not signed in"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">Today's Sign-in / Sign-out Log</h3>
          <span className="text-xs text-muted-foreground">{today}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
              <th className="px-4 py-2.5">Engineer</th>
              <th className="px-4 py-2.5">Shift</th>
              <th className="px-4 py-2.5"><LogIn className="inline h-3.5 w-3.5 mr-1" />Signed in</th>
              <th className="px-4 py-2.5"><LogOut className="inline h-3.5 w-3.5 mr-1" />Signed out</th>
              <th className="px-4 py-2.5">Duration</th>
              <th className="px-4 py-2.5">Note</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...rosterFor(today, "Morning"), ...rosterFor(today, "Night")].map((r) => {
              const live = r.signInAt && !r.signOutAt;
              const mins = durationMinutes(r.signInAt, r.signOutAt);
              return (
                <tr key={`${r.userId}-${r.shift}`}>
                  <td className="px-4 py-3 font-medium">{userById(r.userId)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-flex items-center gap-1">
                      {r.shift === "Morning" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} {r.shift}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums">{fmtTime(r.signInAt)}</td>
                  <td className="px-4 py-3 text-xs tabular-nums">{fmtTime(r.signOutAt)}</td>
                  <td className="px-4 py-3 text-xs tabular-nums">{fmtDuration(mins)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{r.note ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${live ? "bg-success/15 text-success border-success/30" : "bg-info/15 text-info border-info/30"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-success animate-pulse" : "bg-info"}`} />
                      {live ? "On shift" : "Completed"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border"><h3 className="font-semibold">Upcoming Schedule</h3></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5"><Sun className="inline h-3.5 w-3.5 mr-1" />Morning</th>
              <th className="px-4 py-2.5"><Moon className="inline h-3.5 w-3.5 mr-1" />Night</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dates.map((d) => {
              const m = shifts.find((s) => s.date === d && s.type === "Morning");
              const n = shifts.find((s) => s.date === d && s.type === "Night");
              return (
                <tr key={d} className={d === today ? "bg-primary/5" : ""}>
                  <td className="px-4 py-3 text-sm font-medium">{d}{d === today && <span className="ml-2 text-xs text-primary">Today</span>}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1.5">{m?.engineers.map((id) => <span key={id} className="text-xs rounded-full bg-muted px-2 py-0.5">{userById(id).split(" ")[0]}</span>)}</div></td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1.5">{n?.engineers.map((id) => <span key={id} className="text-xs rounded-full bg-muted px-2 py-0.5">{userById(id).split(" ")[0]}</span>)}</div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
