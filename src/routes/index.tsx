import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth, landingFor } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={landingFor(user.role)} />;
}
