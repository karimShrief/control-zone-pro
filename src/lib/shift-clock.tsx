import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { users, userById } from "./mock-data";

export interface ShiftEntry {
  userId: string;
  date: string;        // YYYY-MM-DD
  shift: "Morning" | "Night";
  signInAt: string | null;   // ISO
  signOutAt: string | null;  // ISO
  note?: string;
}

const STORAGE_KEY = "ops-shift-clock";

// Seed mock data: a few engineers already signed in today
function seed(): ShiftEntry[] {
  const today = new Date().toISOString().slice(0, 10);
  const at = (h: number, m = 0) => {
    const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString();
  };
  return [
    { userId: "u1", date: today, shift: "Morning", signInAt: at(6, 4), signOutAt: null, note: "Handover received from u2" },
    { userId: "u3", date: today, shift: "Morning", signInAt: at(5, 58), signOutAt: null },
    { userId: "u5", date: today, shift: "Morning", signInAt: at(6, 12), signOutAt: null, note: "Late — traffic" },
    { userId: "u2", date: today, shift: "Night", signInAt: at(17, 55), signOutAt: at(6, 2), note: "All quiet · escalated INC-2041 to vendor" },
    { userId: "u4", date: today, shift: "Night", signInAt: at(18, 1), signOutAt: at(6, 5) },
    { userId: "u6", date: today, shift: "Night", signInAt: at(18, 10), signOutAt: at(5, 58) },
  ];
}

interface Ctx {
  entries: ShiftEntry[];
  todayFor: (userId: string) => ShiftEntry | undefined;
  signIn: (userId: string, shift: "Morning" | "Night", note?: string) => void;
  signOut: (userId: string, note?: string) => void;
  rosterFor: (date: string, shift: "Morning" | "Night") => ShiftEntry[];
}

const ShiftClockContext = createContext<Ctx | undefined>(undefined);

export function ShiftClockProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ShiftEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setEntries(JSON.parse(raw)); return; } catch { /* fallthrough */ }
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
    entries.find((e) => e.userId === userId && e.date === today());

  const signIn: Ctx["signIn"] = (userId, shift, note) => {
    const d = today();
    const existing = entries.find((e) => e.userId === userId && e.date === d);
    if (existing && existing.signInAt && !existing.signOutAt) return;
    const next = entries.filter((e) => !(e.userId === userId && e.date === d));
    next.push({ userId, date: d, shift, signInAt: new Date().toISOString(), signOutAt: null, note });
    persist(next);
  };

  const signOut: Ctx["signOut"] = (userId, note) => {
    const d = today();
    const next = entries.map((e) =>
      e.userId === userId && e.date === d && e.signInAt && !e.signOutAt
        ? { ...e, signOutAt: new Date().toISOString(), note: note ?? e.note }
        : e
    );
    persist(next);
  };

  const rosterFor: Ctx["rosterFor"] = (date, shift) =>
    entries.filter((e) => e.date === date && e.shift === shift);

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
  if (!iso) return "—";
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
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function userLabel(id: string) { return userById(id) || users.find((u) => u.id === id)?.name || id; }
