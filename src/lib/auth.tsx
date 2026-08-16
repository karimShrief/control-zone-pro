import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type User, type Role } from "./data";
import { authenticateUser, getUserById } from "./services";
import { recordAuditLog } from "./audit-log";

interface AuthState {
  user: User | null;
  login: (username: string, password: string) => User | null;
  logout: () => void;
}

const fallbackAuthState: AuthState = {
  user: null,
  login: () => null,
  logout: () => undefined,
};

const AuthContext = createContext<AuthState>(fallbackAuthState);

const STORAGE_KEY = "ops-command-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem(STORAGE_KEY);
    if (id) {
      const u = getUserById(id);
      if (u) setUser(u);
    }
  }, []);

  const login = (username: string, password: string) => {
    const u = authenticateUser(username, password);
    if (u) {
      setUser(u);
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, u.id);
      recordAuditLog({ actorId: u.id, action: "auth.login", entityType: "auth", entityId: u.id });
      return u;
    }
    return null;
  };

  const logout = () => {
    const previousUser = user;
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    if (previousUser) {
      recordAuditLog({
        actorId: previousUser.id,
        action: "auth.logout",
        entityType: "auth",
        entityId: previousUser.id,
      });
    }
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? fallbackAuthState;
}

export function landingFor(role: Role): string {
  switch (role) {
    case "engineer":
      return "/my-work";
    case "shift-lead":
      return "/my-work";
    case "manager":
      return "/dashboard";
    case "executive":
      return "/dashboard";
    case "admin":
      return "/admin";
  }
}
