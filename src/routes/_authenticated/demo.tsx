import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/risk-badge";
import { Play, RotateCcw, CheckCircle2, XCircle, Loader2, Cpu, FlaskConical } from "lucide-react";
import {
  PRESETS,
  REGLAS,
  evaluarCaso,
  nivelDeScore,
  explicar,
  type CasoInput,
  type ReglaResultado,
} from "@/lib/fraud-rules";

export const Route = createFileRoute("/_authenticated/demo")({
  head: () => ({ meta: [{ title: "Simulador en vivo · FraudIA Claims" }] }),
  component: DemoPage,
});

type Estado = "idle" | "running" | "done";

function DemoPage() {
  const [caso, setCaso] = useState<CasoInput>(PRESETS.limpio.caso);
  const [resultados, setResultados] = useState<ReglaResultado[]>([]);
  const [evaluadasIdx, setEvaluadasIdx] = useState<number>(-1); // índice de la última regla animada
  const [estado, setEstado] = useState<Estado>("idle");
  const [presetActivo, setPresetActivo] = useState<string>("limpio");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const finalReglas = useMemo(() => evaluarCaso(caso), [caso]);
  const scoreParcial = useMemo(
    () =>
      Math.min(
        100,
        resultados.slice(0, evaluadasIdx + 1).reduce((acc, r) => (r.activada ? acc + r.puntos : acc), 0),
      ),
    [resultados, evaluadasIdx],
  );
  const scoreFinal = estado === "done" ? scoreParcial : scoreParcial;
  const nivelActual = nivelDeScore(scoreFinal);

  function limpiarTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function aplicarPreset(key: string) {
    limpiarTimers();
    setPresetActivo(key);
    setCaso(PRESETS[key].caso);
    setResultados([]);
    setEvaluadasIdx(-1);
    setEstado("idle");
  }

  function analizar() {
    limpiarTimers();
    const evaluadas = evaluarCaso(caso);
    setResultados(evaluadas);
    setEvaluadasIdx(-1);
    setEstado("running");
    evaluadas.forEach((_, i) => {
      const t = setTimeout(() => {
        setEvaluadasIdx(i);
        if (i === evaluadas.length - 1) setEstado("done");
      }, 350 * (i + 1));
      timersRef.current.push(t);
    });
  }

  function reset() {
    limpiarTimers();
    setResultados([]);
    setEvaluadasIdx(-1);
    setEstado("idle");
  }

  const explicacion = estado === "done" ? explicar(finalReglas, scoreFinal) : "";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            Simulador en vivo
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa un caso o usa un preset y observa cómo el agente evalúa cada regla, suma puntos y cruza los umbrales de riesgo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={analizar} disabled={estado === "running"} className="gap-2">
            {estado === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {estado === "running" ? "Analizando…" : "Analizar caso"}
          </Button>
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reiniciar
          </Button>
        </div>
      </div>

      {/* Presets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Escenarios predefinidos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => aplicarPreset(key)}
              className={`text-left rounded-md border px-3 py-2 transition-colors hover:bg-accent ${
                presetActivo === key ? "border-primary bg-accent" : "border-border bg-card"
              }`}
            >
              <div className="text-sm font-semibold">{p.label}</div>
              <div className="text-xs text-muted-foreground">{p.descripcion}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Formulario */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Datos del siniestro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Campo label="Ramo">
              <Input value={caso.ramo} onChange={(e) => setCaso({ ...caso, ramo: e.target.value })} />
            </Campo>
            <Campo label="Ciudad">
              <Input value={caso.ciudad} onChange={(e) => setCaso({ ...caso, ciudad: e.target.value })} />
            </Campo>
            <div className="grid grid-cols-2 gap-2">
              <Campo label="Monto reclamado (USD)">
                <Input type="number" value={caso.monto_reclamado} onChange={(e) => setCaso({ ...caso, monto_reclamado: Number(e.target.value) })} />
              </Campo>
              <Campo label="Suma asegurada">
                <Input type="number" value={caso.suma_asegurada} onChange={(e) => setCaso({ ...caso, suma_asegurada: Number(e.target.value) })} />
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Campo label="Días al reportar">
                <Input type="number" value={caso.dias_reporte} onChange={(e) => setCaso({ ...caso, dias_reporte: Number(e.target.value) })} />
              </Campo>
              <Campo label="Antigüedad póliza (días)">
                <Input type="number" value={caso.antiguedad_poliza_dias} onChange={(e) => setCaso({ ...caso, antiguedad_poliza_dias: Number(e.target.value) })} />
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Campo label="Reclamos últ. 12m">
                <Input type="number" value={caso.reclamos_ult_12m} onChange={(e) => setCaso({ ...caso, reclamos_ult_12m: Number(e.target.value) })} />
              </Campo>
              <Campo label="Casos proveedor 12m">
                <Input type="number" value={caso.proveedor_casos_anio} onChange={(e) => setCaso({ ...caso, proveedor_casos_anio: Number(e.target.value) })} />
              </Campo>
            </div>
            <Toggle label="Documentos completos" checked={caso.documentos_completos} onChange={(v) => setCaso({ ...caso, documentos_completos: v })} />
            <Toggle label="Proveedor en lista restrictiva" checked={caso.proveedor_lista_restrictiva} onChange={(v) => setCaso({ ...caso, proveedor_lista_restrictiva: v })} />
            <Toggle label="Placa reincidente" checked={caso.placa_reincidente} onChange={(v) => setCaso({ ...caso, placa_reincidente: v })} />
            <Toggle label="Beneficiario distinto al titular" checked={caso.beneficiario_distinto_titular} onChange={(v) => setCaso({ ...caso, beneficiario_distinto_titular: v })} />
            <Toggle label="Ocurrencia en madrugada (00:00–05:00)" checked={caso.hora_madrugada} onChange={(v) => setCaso({ ...caso, hora_madrugada: v })} />

            <Campo label="Tipo de impacto (dinámica)">
              <select
                value={caso.tipo_impacto ?? "ninguno"}
                onChange={(e) => setCaso({ ...caso, tipo_impacto: e.target.value as CasoInput["tipo_impacto"] })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ninguno">— Sin marca —</option>
                <option value="frontal">Frontal (+4)</option>
                <option value="posterior">Posterior (+4)</option>
                <option value="volcadura">Volcadura (+6)</option>
                <option value="multiple">Múltiple (+6, +3 si madrugada)</option>
              </select>
            </Campo>
            <Toggle label="Relato ilógico vs tipo de impacto (+6)" checked={!!caso.relato_ilogico} onChange={(v) => setCaso({ ...caso, relato_ilogico: v })} />
          </CardContent>
        </Card>


        {/* Razonamiento del agente */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Razonamiento del agente
              {estado === "running" && (
                <Badge variant="secondary" className="ml-2 gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Evaluando reglas
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Score + umbrales */}
            <div>
              <div className="flex items-end justify-between mb-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Score de riesgo</span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold tabular-nums">{scoreFinal}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                  <RiskBadge nivel={nivelActual} />
                </div>
              </div>
              <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out ${
                    nivelActual === "rojo" ? "bg-risk-rojo" : nivelActual === "amarillo" ? "bg-risk-amarillo" : "bg-risk-verde"
                  }`}
                  style={{ width: `${scoreFinal}%` }}
                />
                {/* Umbrales */}
                <div className="absolute inset-y-0 left-[41%] w-px bg-foreground/40" title="Umbral amarillo (41)" />
                <div className="absolute inset-y-0 left-[76%] w-px bg-foreground/40" title="Umbral rojo (76)" />
              </div>
              <div className="relative mt-1 text-[10px] text-muted-foreground">
                <span className="absolute left-0">0</span>
                <span className="absolute left-[40%]">41 · amarillo</span>
                <span className="absolute left-[75%]">76 · rojo</span>
                <span className="absolute right-0">100</span>
                <span className="opacity-0">.</span>
              </div>
            </div>

            {/* Trace de reglas */}
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Trazado regla por regla</div>
              <div className="space-y-1.5">
                {(resultados.length ? resultados : REGLAS.map((r) => ({ ...r, activada: false }) as ReglaResultado)).map((r, i) => {
                  const yaEvaluada = i <= evaluadasIdx;
                  const enCurso = estado === "running" && i === evaluadasIdx + 1;
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center gap-3 rounded-md border px-3 py-2 transition-all duration-300 ${
                        !yaEvaluada
                          ? "opacity-40 bg-muted/30"
                          : r.activada
                          ? "border-risk-rojo/50 bg-risk-rojo/5"
                          : "border-risk-verde/40 bg-risk-verde/5"
                      } ${enCurso ? "ring-2 ring-primary/50" : ""}`}
                    >
                      <div className="w-5 flex justify-center">
                        {!yaEvaluada ? (
                          enCurso ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                          )
                        ) : r.activada ? (
                          <XCircle className="h-4 w-4 text-risk-rojo" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-risk-verde" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
                          {r.nombre}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {r.descripcion}
                          {yaEvaluada && r.detalle && <span className="ml-1">· <span className="font-medium">{r.detalle}</span></span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-xs font-mono">
                        {yaEvaluada && r.activada ? (
                          <span className="text-risk-rojo font-bold">+{r.puntos}</span>
                        ) : yaEvaluada ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="text-muted-foreground/50">+{r.puntos}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explicación */}
            {estado === "done" && (
              <div className="rounded-md border bg-card p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Veredicto explicable</div>
                <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: explicacion.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <Label className="text-xs cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
