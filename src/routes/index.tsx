import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FraudIA Claims" },
      { name: "description", content: "Detección asistida de fraude para Aseguradora del Sur." },
    ],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    navigate({ to: user ? "/dashboard" : "/login", replace: true });
  }, [loading, user, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Cargando FraudIA Claims…
    </div>
  );
}
