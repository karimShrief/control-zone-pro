import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { users, userById, type ShiftType } from "./data";
import { recordAuditLog } from "./audit-log";

export interface ShiftEntry {
  userId: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  signInAt: string | null; // ISO
  signOutAt: string | null; // ISO
  note?: string;
}

const STORAGE_KEY = "ops-shift-clock-v2";

function seed(): ShiftEntry[] {
  return [];
}

interface Ctx {
  entries: ShiftEntry[];
  todayFor: (userId: string) => ShiftEntry | undefined;
  signIn: (userId: string, shift: ShiftType, note?: string) => void;
  signOut: (userId: string, note?: string) => void;
  rosterFor: (date: string, shift: ShiftType) => ShiftEntry[];
}

const ShiftClockContext = createContext<Ctx | undefined>(undefined);

export function ShiftClockProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ShiftEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setEntries(JSON.parse(raw));
        return;
      } catch {
        /* fallthrough */
      }
    }
    const s = seed();
    setEntries(s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }, []);

  const persist = (next: ShiftEntry[]) => {
    setEntries(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const today = () => new Date().toISOString().slice(0, 10);

  const todayFor: Ctx["todayFor"] = (userId) =>
    entries.find((entry) => entry.userId === userId && entry.date === today());

  const signIn: Ctx["signIn"] = (userId, shift, note) => {
    const d = today();
    const existing = entries.find((entry) => entry.userId === userId && entry.date === d);
    if (existing && existing.signInAt && !existing.signOutAt) return;
    const next = entries.filter((entry) => !(entry.userId === userId && entry.date === d));
    const entry = {
      userId,
      date: d,
      shift,
      signInAt: new Date().toISOString(),
      signOutAt: null,
      note,
    };
    next.push(entry);
    persist(next);
    recordAuditLog({
      actorId: userId,
      action: "shift.sign-in",
      entityType: "shift",
      entityId: `${userId}-${d}`,
      after: entry,
    });
  };

  const signOut: Ctx["signOut"] = (userId, note) => {
    const d = today();
    let updated: ShiftEntry | undefined;
    const next = entries.map((entry) => {
      if (entry.userId === userId && entry.date === d && entry.signInAt && !entry.signOutAt) {
        updated = { ...entry, signOutAt: new Date().toISOString(), note: note ?? entry.note };
        return updated;
      }
      return entry;
    });
    persist(next);
    if (updated) {
      recordAuditLog({
        actorId: userId,
        action: "shift.sign-out",
        entityType: "shift",
        entityId: `${userId}-${d}`,
        after: updated,
      });
    }
  };

  const rosterFor: Ctx["rosterFor"] = (date, shift) =>
    entries.filter((entry) => entry.date === date && entry.shift === shift);

  return (
    <ShiftClockContext.Provider value={{ entries, todayFor, signIn, signOut, rosterFor }}>
      {children}
    </ShiftClockContext.Provider>
  );
}

export function useShiftClock() {
  const ctx = useContext(ShiftClockContext);
  if (!ctx) throw new Error("useShiftClock must be used inside ShiftClockProvider");
  return ctx;
}

export function fmtTime(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function durationMinutes(a: string | null, b: string | null) {
  if (!a) return 0;
  const start = new Date(a).getTime();
  const end = b ? new Date(b).getTime() : Date.now();
  return Math.max(0, Math.round((end - start) / 60000));
}

export function fmtDuration(mins: number) {
  if (mins <= 0) return "-";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function userLabel(id: string) {
  return userById(id) || users.find((user) => user.id === id)?.name || id;
}
