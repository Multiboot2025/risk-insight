import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ChatFab } from "@/components/chat-fab";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 gap-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="hidden md:block text-sm font-medium text-muted-foreground">
                Panel de detección de fraude
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-1" /> Salir
              </Button>
            </div>
          </header>

          <div className="bg-risk-amarillo/15 border-b border-risk-amarillo/30 px-4 py-2 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-risk-amarillo-foreground" />
            <p className="text-xs text-risk-amarillo-foreground leading-relaxed">
              <strong>Aviso:</strong> Las alertas y scores son apoyo analítico, <strong>no</strong> determinan fraude.
              La decisión final corresponde al analista humano. Datos sintéticos para fines de demostración.
            </p>
          </div>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
          <ChatFab />
        </div>
      </div>
    </SidebarProvider>
  );
}
