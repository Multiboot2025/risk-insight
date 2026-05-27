import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/risk-badge";
import {
  Bell, AlertOctagon, AlertTriangle, ShieldCheck, ExternalLink,
  Filter, CheckCircle2, Search, Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/alertas")({
  head: () => ({ meta: [{ title: "Centro de Alertas · FraudIA Claims" }] }),
  component: AlertasPage,
});

type Sin = {
  id_siniestro: string;
  ramo: string | null;
  ciudad: string | null;
  descripcion: string | null;
  monto_reclamado: number | null;
  fecha_reporte: string | null;
  fecha_ocurrencia: string | null;
  score_riesgo: number | null;
  nivel_riesgo: string | null;
  explicacion_ia: string | null;
  reglas_activadas: any;
  estado: string | null;
};

function fmt(n: number | null | undefined) {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n ?? 0);
}

function AlertasPage() {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<"todos" | "rojo" | "amarillo">("todos");
  const [busqueda, setBusqueda] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["alertas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("siniestros")
        .select("id_siniestro, ramo, ciudad, descripcion, monto_reclamado, fecha_reporte, fecha_ocurrencia, score_riesgo, nivel_riesgo, explicacion_ia, reglas_activadas, estado")
        .in("nivel_riesgo", ["rojo", "amarillo"])
        .order("score_riesgo", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Sin[];
    },
  });

  const filtrados = useMemo(() => {
    let arr = data ?? [];
    if (filtro !== "todos") arr = arr.filter((s) => s.nivel_riesgo === filtro);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      arr = arr.filter((s) =>
        [s.ramo, s.ciudad, s.descripcion, s.id_siniestro].some((v) => (v ?? "").toLowerCase().includes(q))
      );
    }
    return arr;
  }, [data, filtro, busqueda]);

  // Agrupación por patrón dominante (primera regla activada con mayor peso)
  const porPatron = useMemo(() => {
    const map = new Map<string, Sin[]>();
    (data ?? []).forEach((s) => {
      const reglas = Array.isArray(s.reglas_activadas) ? s.reglas_activadas : [];
      const top = reglas[0]?.nombre || reglas[0]?.regla || "Otros patrones";
      const arr = map.get(top) ?? [];
      arr.push(s);
      map.set(top, arr);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [data]);

  const rojos = (data ?? []).filter((s) => s.nivel_riesgo === "rojo").length;
  const amarillos = (data ?? []).filter((s) => s.nivel_riesgo === "amarillo").length;
  const montoEnRiesgo = (data ?? []).reduce((acc, s) => acc + Number(s.monto_reclamado ?? 0), 0);

  const marcarRevisado = async (id: string) => {
    const { error } = await supabase.from("siniestros").update({ estado: "en_revision" }).eq("id_siniestro", id);
    if (error) toast.error("No se pudo actualizar");
    else {
      toast.success("Caso marcado en revisión");
      qc.invalidateQueries({ queryKey: ["alertas"] });
    }
  };

  const registrarAlerta = async (s: Sin) => {
    const { error } = await supabase.from("alertas_log").insert({
      id_siniestro: s.id_siniestro,
      nivel_riesgo: s.nivel_riesgo,
      score: s.score_riesgo,
      payload: { reglas: s.reglas_activadas, explicacion: s.explicacion_ia },
      email_enviado: false,
    });
    if (error) toast.error("No se pudo registrar");
    else toast.success("Alerta registrada en bitácora");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-risk-rojo/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-risk-rojo" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Centro de Alertas</h1>
            <p className="text-sm text-muted-foreground">
              Casos que el motor identificó como posibles fraudes — priorizados por score.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-risk-rojo/30">
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertOctagon className="h-8 w-8 text-risk-rojo" />
            <div>
              <p className="text-xs uppercase text-muted-foreground">Alertas críticas</p>
              <p className="text-3xl font-bold">{isLoading ? "…" : rojos}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-risk-amarillo/30">
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-risk-amarillo" />
            <div>
              <p className="text-xs uppercase text-muted-foreground">Alertas medias</p>
              <p className="text-3xl font-bold">{isLoading ? "…" : amarillos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs uppercase text-muted-foreground">Monto en riesgo</p>
              <p className="text-3xl font-bold">{isLoading ? "…" : fmt(montoEnRiesgo)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patrones recurrentes */}
      {porPatron.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Patrones recurrentes detectados
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {porPatron.map(([nombre, arr]) => (
              <Badge key={nombre} variant="secondary" className="text-xs py-1.5 px-3">
                {nombre} · <span className="ml-1 font-bold">{arr.length}</span>
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Button size="sm" variant={filtro === "todos" ? "default" : "outline"} onClick={() => setFiltro("todos")}>
          Todos ({(data ?? []).length})
        </Button>
        <Button size="sm" variant={filtro === "rojo" ? "default" : "outline"} onClick={() => setFiltro("rojo")}>
          🔴 Rojo ({rojos})
        </Button>
        <Button size="sm" variant={filtro === "amarillo" ? "default" : "outline"} onClick={() => setFiltro("amarillo")}>
          🟡 Amarillo ({amarillos})
        </Button>
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ramo, ciudad, id…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Cargando alertas…</p>}
        {!isLoading && filtrados.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-risk-verde" />
              No hay alertas activas con los filtros seleccionados.
            </CardContent>
          </Card>
        )}
        {filtrados.map((s) => {
          const reglas = Array.isArray(s.reglas_activadas) ? s.reglas_activadas : [];
          return (
            <Card key={s.id_siniestro} className={s.nivel_riesgo === "rojo" ? "border-risk-rojo/40" : "border-risk-amarillo/40"}>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <RiskBadge nivel={s.nivel_riesgo as any} score={s.score_riesgo ?? undefined} />
                      <span className="text-sm font-semibold">{s.ramo} · {s.ciudad}</span>
                      <Badge variant="outline" className="text-[10px]">{s.estado}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Reportado {s.fecha_reporte ?? "—"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.descripcion}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold font-mono">{fmt(Number(s.monto_reclamado ?? 0))}</p>
                    <p className="text-[10px] text-muted-foreground">monto reclamado</p>
                  </div>
                </div>

                {reglas.length > 0 && (
                  <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      ¿Por qué se disparó la alerta?
                    </p>
                    <ul className="space-y-1">
                      {reglas.slice(0, 4).map((r: any, i: number) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <span className="text-risk-rojo mt-0.5">●</span>
                          <span>
                            <strong>{r.nombre ?? r.regla ?? `Regla ${i + 1}`}</strong>
                            {r.detalle && <span className="text-muted-foreground"> — {r.detalle}</span>}
                            {r.puntos && <span className="ml-1 font-mono text-muted-foreground">(+{r.puntos})</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {s.explicacion_ia && (
                  <p className="text-xs italic text-muted-foreground border-l-2 border-primary/40 pl-3">
                    {s.explicacion_ia}
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <Button asChild size="sm" variant="default">
                    <Link to="/casos/$id" params={{ id: s.id_siniestro }}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir expediente
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => marcarRevisado(s.id_siniestro)}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Marcar en revisión
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => registrarAlerta(s)}>
                    <Bell className="h-3.5 w-3.5 mr-1.5" /> Registrar en bitácora
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
