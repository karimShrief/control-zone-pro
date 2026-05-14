import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type User, type Role } from "./mock-data";
import { backendClient } from "./backend-client";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const STORAGE_KEY = "ops-command-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }
    const id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      setIsLoading(false);
      return;
    }

    backendClient
      .getUser(id)
      .then(({ user: restored }) => setUser(restored))
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const { user: u } = await backendClient.login(username, password);
      setUser(u);
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, u.id);
      return u;
    } catch {
      return null;
    }
  };

  const logout = () => {
    const previousUser = user;
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    if (previousUser) {
      backendClient.logout(previousUser.id).catch(() => undefined);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function landingFor(role: Role): string {
  switch (role) {
    case "engineer":
      return "/my-work";
    case "manager":
      return "/dashboard";
    case "executive":
      return "/dashboard";
    case "admin":
      return "/admin";
  }
}
