import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reportes")({
  component: ReportesPage,
});

function ReportesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Reportes</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Informes imprimibles de siniestros y alertas.
      </p>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Próximamente — paso 13 del roadmap.
      </div>
    </div>
  );
}
