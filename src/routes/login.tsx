import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth, landingFor } from "@/lib/auth";
import { Activity, Shield, Lock } from "lucide-react";
import { users } from "@/lib/mock-data";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");

  if (user) return <Navigate to={landingFor(user.role)} />;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const u = login(username, password);
    if (u) navigate({ to: landingFor(u.role) });
    else setError("Invalid credentials. Try one of the demo accounts below.");
  };

  const demo = [
    { label: "Engineer", username: "ahmed" },
    { label: "Manager", username: "manager" },
    { label: "Executive", username: "exec" },
    { label: "Admin", username: "admin" },
  ];

  return (
    <div className="min-h-screen w-full flex bg-sidebar text-sidebar-foreground">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 20%, oklch(0.62 0.18 245 / 0.6), transparent 40%), radial-gradient(circle at 75% 80%, oklch(0.55 0.2 220 / 0.5), transparent 40%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-md bg-sidebar-primary flex items-center justify-center">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-semibold">Ops Command Platform</div>
              <div className="text-xs uppercase tracking-widest text-sidebar-foreground/60">
                Data Center · NOC
              </div>
            </div>
          </div>
        </div>
        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">
            Unified command center for live operations.
          </h1>
          <p className="text-sidebar-foreground/70 text-base">
            Track tasks, incidents, projects, shifts and handovers from a single operations control
            surface — built for engineers, managers and executives.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {[
              { k: "99.98%", v: "Service Availability" },
              { k: "12 min", v: "Avg. Resolution" },
              { k: "ISO 27001", v: "Aligned" },
              { k: "24×7", v: "NOC Coverage" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3"
              >
                <div className="text-lg font-semibold text-sidebar-primary-foreground">{s.k}</div>
                <div className="text-xs text-sidebar-foreground/70">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" /> Restricted access · authorized personnel only
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background text-foreground">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
                <Activity className="h-5 w-5" />
              </div>
              <div className="font-semibold">Ops Command</div>
            </div>
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Use your operations credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground uppercase tracking-wider">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. ahmed"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="demo"
              />
            </div>
            {error && <div className="text-sm text-critical">{error}</div>}
            <button
              type="submit"
              className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" /> Sign in securely
            </button>
          </form>

          <div className="mt-8">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Demo accounts (password: demo)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demo.map((d) => (
                <button
                  key={d.username}
                  type="button"
                  onClick={() => {
                    setUsername(d.username);
                    setPassword("demo");
                  }}
                  className="rounded-md border border-border bg-card px-3 py-2 text-left text-xs hover:border-primary transition"
                >
                  <div className="font-medium text-foreground">{d.label}</div>
                  <div className="text-muted-foreground">{d.username}</div>
                </button>
              ))}
            </div>
            <div className="text-[11px] text-muted-foreground mt-3">
              All {users.length} demo users use password <span className="font-mono">demo</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
