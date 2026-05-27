import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/risk-badge";
import { AlertCircle, FileWarning, Gauge, ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · FraudIA Claims" }] }),
  component: Dashboard,
});

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
}

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const { data: sin, error } = await supabase
        .from("siniestros")
        .select("id_siniestro, nivel_riesgo, score_riesgo, monto_reclamado, ramo, ciudad, fecha_reporte, descripcion, reglas_activadas, estado")
        .order("score_riesgo", { ascending: false });
      if (error) throw error;
      return sin ?? [];
    },
  });

  const total = data?.length ?? 0;
  const por = { verde: 0, amarillo: 0, rojo: 0 } as Record<string, number>;
  let totalReclamado = 0;
  let totalRojo = 0;
  data?.forEach((s) => {
    por[s.nivel_riesgo ?? "verde"] = (por[s.nivel_riesgo ?? "verde"] ?? 0) + 1;
    totalReclamado += Number(s.monto_reclamado ?? 0);
    if (s.nivel_riesgo === "rojo") totalRojo += Number(s.monto_reclamado ?? 0);
  });
  const topRojos = (data ?? []).filter((s) => s.nivel_riesgo === "rojo").slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen operativo de siniestros y alertas de fraude.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<ListChecks className="h-4 w-4" />} label="Siniestros totales" value={isLoading ? "…" : String(total)} hint="Últimos 30 días" />
        <KpiCard icon={<Gauge className="h-4 w-4" />} label="Casos en alerta" value={isLoading ? "…" : String((por.amarillo ?? 0) + (por.rojo ?? 0))} hint={`${por.rojo ?? 0} rojos · ${por.amarillo ?? 0} amarillos`} />
        <KpiCard icon={<AlertCircle className="h-4 w-4" />} label="Monto en riesgo (rojo)" value={isLoading ? "…" : formatCOP(totalRojo)} hint="Suma reclamada" />
        <KpiCard icon={<FileWarning className="h-4 w-4" />} label="Monto reclamado total" value={isLoading ? "…" : formatCOP(totalReclamado)} hint="Todos los casos" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Distribución por riesgo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["rojo", "amarillo", "verde"] as const).map((k) => {
              const v = por[k] ?? 0;
              const pct = total ? (v / total) * 100 : 0;
              return (
                <div key={k} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <RiskBadge nivel={k} />
                    <span className="font-mono">{v} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={
                        k === "rojo" ? "h-full bg-risk-rojo" : k === "amarillo" ? "h-full bg-risk-amarillo" : "h-full bg-risk-verde"
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top 5 casos críticos (rojo)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
            {!isLoading && topRojos.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin casos rojos.</p>
            )}
            {topRojos.map((s) => (
              <Link
                key={s.id_siniestro}
                to="/casos/$id"
                params={{ id: s.id_siniestro }}
                className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2 hover:bg-accent transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{s.ramo} · {s.ciudad}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.descripcion}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-mono">{formatCOP(Number(s.monto_reclamado ?? 0))}</span>
                  <RiskBadge nivel={s.nivel_riesgo} score={s.score_riesgo ?? undefined} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs uppercase tracking-wide">{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}
