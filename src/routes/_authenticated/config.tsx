import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/config")({
  component: ConfigPage,
});

function ConfigPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Configuración</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Umbrales de riesgo, reglas y parámetros del motor.
      </p>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Próximamente — paso 14 del roadmap.
      </div>
    </div>
  );
}
