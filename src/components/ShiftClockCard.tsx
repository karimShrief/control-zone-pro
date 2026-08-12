import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useShiftClock, fmtTime, fmtDuration, durationMinutes } from "@/lib/shift-clock";
import { Sun, Moon, LogIn, LogOut, Clock, CheckCircle2, Sunset } from "lucide-react";
import { shiftService } from "@/lib/services";
import type { ShiftType } from "@/lib/data";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function ShiftClockCard({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { todayFor, signIn, signOut } = useShiftClock();
  const shiftTypes = shiftService.listShiftTypes().filter((item) => item.enabled);
  const [openIn, setOpenIn] = useState(false);
  const [openOut, setOpenOut] = useState(false);
  const [shift, setShift] = useState<ShiftType>(shiftTypes[0]?.name ?? "Morning");
  const [note, setNote] = useState("");

  if (!user || user.role !== "engineer") return null;

  const today = new Date().toISOString().slice(0, 10);
  const scheduled = shiftService
    .listSchedule()
    .find((item) => item.date === today && item.engineers.includes(user.id));
  const entry = todayFor(user.id);
  const onShift = !!entry?.signInAt && !entry?.signOutAt;
  const completed = !!entry?.signInAt && !!entry?.signOutAt;
  const live = entry?.signInAt && !entry?.signOutAt ? durationMinutes(entry.signInAt, null) : 0;

  const doIn = () => {
    signIn(user.id, shift, note.trim() || undefined);
    toast.success(`Signed in to ${shift} shift`);
    setOpenIn(false);
    setNote("");
  };

  const doOut = () => {
    signOut(user.id, note.trim() || undefined);
    toast.success("Signed out - shift complete");
    setOpenOut(false);
    setNote("");
  };

  return (
    <div
      className={`rounded-lg border bg-card p-4 ${onShift ? "border-success/40" : "border-border"}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Shift Clock
          </div>
          <div className="mt-1 flex items-center gap-2">
            <ShiftIcon shift={scheduled?.type} />
            <span className="font-semibold">
              {scheduled?.type ?? "Off-shift"} - {today}
            </span>
          </div>
        </div>
        <StatusPill state={onShift ? "on" : completed ? "done" : "off"} />
      </div>

      {entry ? (
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <Stat label="Sign-in" value={fmtTime(entry.signInAt)} />
          <Stat
            label={onShift ? "Live" : "Duration"}
            value={fmtDuration(onShift ? live : durationMinutes(entry.signInAt, entry.signOutAt))}
            highlight={onShift}
          />
          <Stat label="Sign-out" value={fmtTime(entry.signOutAt)} />
        </div>
      ) : (
        <div className="text-xs text-muted-foreground mb-3">
          {scheduled
            ? "You haven't signed in yet for today's shift."
            : "You're not on the roster today. You can still sign in if covering."}
        </div>
      )}

      {entry?.note && !compact && (
        <div className="text-xs rounded-md bg-muted/40 border border-border px-2.5 py-1.5 mb-3">
          <span className="text-muted-foreground">Note:</span> {entry.note}
        </div>
      )}

      <div className="flex items-center gap-2">
        {!onShift && !completed && (
          <button
            onClick={() => {
              setShift(scheduled?.type ?? shiftTypes[0]?.name ?? "Morning");
              setOpenIn(true);
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-success/15 text-success border border-success/30 px-3 py-2 text-sm font-medium hover:bg-success/20"
          >
            <LogIn className="h-4 w-4" /> Sign in
          </button>
        )}
        {onShift && (
          <button
            onClick={() => setOpenOut(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-critical/15 text-critical border border-critical/30 px-3 py-2 text-sm font-medium hover:bg-critical/20"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        )}
        {completed && (
          <div className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-muted text-muted-foreground px-3 py-2 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Shift completed
          </div>
        )}
      </div>

      <Dialog open={openIn} onOpenChange={setOpenIn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to shift</DialogTitle>
            <DialogDescription>
              Confirm your shift and add an optional opening note for the team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Shift
              </label>
              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {shiftTypes.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setShift(item.name)}
                    className={`rounded-md border px-3 py-2 text-sm inline-flex items-center justify-center gap-2 ${
                      shift === item.name
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <ShiftIcon shift={item.name} /> {item.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Opening note (optional)
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Handover acknowledged, status of open items..."
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Sign-in time will be recorded as{" "}
              <span className="font-medium text-foreground">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              .
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setOpenIn(false)}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={doIn}
              className="rounded-md bg-success text-success-foreground px-3 py-2 text-sm hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <LogIn className="h-4 w-4" /> Confirm sign-in
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openOut} onOpenChange={setOpenOut}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out of shift</DialogTitle>
            <DialogDescription>
              Wrap up your shift with a closing note for the next team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-center">
              <Stat label="Sign-in" value={fmtTime(entry?.signInAt ?? null)} />
              <Stat
                label="On shift"
                value={fmtDuration(durationMinutes(entry?.signInAt ?? null, null))}
                highlight
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Closing note
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                placeholder="Open incidents, pending tasks, anything next shift should know..."
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setOpenOut(false)}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={doOut}
              className="rounded-md bg-critical text-critical-foreground px-3 py-2 text-sm hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" /> Confirm sign-out
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShiftIcon({ shift }: { shift?: ShiftType }) {
  if (shift === "Night") return <Moon className="h-4 w-4 text-info" />;
  if (shift === "Evening") return <Sunset className="h-4 w-4 text-warning-foreground" />;
  return <Sun className="h-4 w-4 text-warning-foreground" />;
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-md border px-2 py-1.5 ${
        highlight ? "border-success/40 bg-success/10" : "border-border bg-muted/30"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${highlight ? "text-success" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function StatusPill({ state }: { state: "on" | "off" | "done" }) {
  const map = {
    on: {
      cls: "bg-success/15 text-success border-success/30",
      label: "On shift",
      dot: "bg-success animate-pulse",
    },
    off: {
      cls: "bg-muted text-muted-foreground border-border",
      label: "Off shift",
      dot: "bg-muted-foreground",
    },
    done: { cls: "bg-info/15 text-info border-info/30", label: "Completed", dot: "bg-info" },
  }[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${map.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${map.dot}`} /> {map.label}
    </span>
  );
}
