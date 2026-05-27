import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/proveedores")({
  component: ProveedoresPage,
});

function ProveedoresPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-2">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Proveedores</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Ranking de proveedores por nivel de riesgo y reincidencia.
      </p>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Próximamente — paso 12 del roadmap.
      </div>
    </div>
  );
}
