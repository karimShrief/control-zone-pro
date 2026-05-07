import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { shifts, userById } from "@/lib/mock-data";
import { Sun, Moon } from "lucide-react";

export const Route = createFileRoute("/shifts")({
  component: ShiftsPage,
});

function ShiftsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const dates = Array.from(new Set(shifts.map((s) => s.date))).sort();

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Shift Schedule" subtitle="Morning and Night shifts · DC and NOC engineers" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {(["Morning", "Night"] as const).map((type) => {
          const todays = shifts.find((s) => s.date === today && s.type === type);
          return (
            <div key={type} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                {type === "Morning" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} On Shift Now · {type}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {todays?.engineers.map((id) => (
                  <div key={id} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm">
                    <span className="h-2 w-2 rounded-full bg-success" /> {userById(id)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
