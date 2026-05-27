import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/risk-badge";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/casos/$id")({
  head: () => ({ meta: [{ title: "Detalle del caso · FraudIA Claims" }] }),
  component: CasoDetalle,
});

function CasoDetalle() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["caso", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("siniestros").select("*").eq("id_siniestro", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm"><Link to="/casos"><ArrowLeft className="h-4 w-4 mr-1" /> Volver a la bandeja</Link></Button>
      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {!isLoading && !data && <p className="text-sm text-muted-foreground">Caso no encontrado.</p>}
      {data && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">{data.ramo} · {data.ciudad}</CardTitle>
              <p className="text-xs font-mono text-muted-foreground mt-1">{data.id_siniestro}</p>
            </div>
            <RiskBadge nivel={data.nivel_riesgo} score={data.score_riesgo ?? undefined} />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Info label="Fecha ocurrencia" value={data.fecha_ocurrencia} />
              <Info label="Fecha reporte" value={data.fecha_reporte} />
              <Info label="Estado" value={data.estado} />
              <Info label="Asegurado" value={data.id_asegurado} />
              <Info label="Póliza" value={data.id_poliza} />
              <Info label="Proveedor" value={data.id_proveedor} />
              <Info label="Reclamado" value={data.monto_reclamado} />
              <Info label="Estimado" value={data.monto_estimado} />
              <Info label="Pagado" value={data.monto_pagado} />
            </div>
            <div className="pt-2">
              <p className="text-xs uppercase text-muted-foreground mb-1">Descripción</p>
              <p>{data.descripcion}</p>
            </div>
            <p className="text-xs text-muted-foreground pt-3 border-t">
              Detalle completo (reglas activadas, documentos, explicación IA) se implementará en los próximos pasos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value == null || value === "" ? "—" : String(value)}</p>
    </div>
  );
}
