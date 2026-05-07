import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { users, type User, type Role } from "./mock-data";

interface AuthState {
  user: User | null;
  login: (username: string, password: string) => User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const STORAGE_KEY = "ops-command-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem(STORAGE_KEY);
    if (id) {
      const u = users.find((x) => x.id === id);
      if (u) setUser(u);
    }
  }, []);

  const login = (username: string, password: string) => {
    const u = users.find(
      (x) => x.username.toLowerCase() === username.toLowerCase() && x.password === password,
    );
    if (u) {
      setUser(u);
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, u.id);
      return u;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function landingFor(role: Role): string {
  switch (role) {
    case "engineer": return "/my-work";
    case "manager": return "/dashboard";
    case "executive": return "/dashboard";
    case "admin": return "/admin";
  }
}
