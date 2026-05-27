import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/risk-badge";
import {
  Upload, Play, Pause, RotateCcw, FileSpreadsheet, Loader2,
  Download, Cpu, AlertOctagon, AlertTriangle, ShieldCheck, Save,
} from "lucide-react";
import { evaluarCaso, nivelDeScore, explicar, type CasoInput, type ReglaResultado } from "@/lib/fraud-rules";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lote")({
  head: () => ({ meta: [{ title: "Análisis por lote · FraudIA Claims" }] }),
  component: LotePage,
});

type Fila = {
  idx: number;
  raw: Record<string, string>;
  caso: CasoInput;
  reglas?: ReglaResultado[];
  score?: number;
  nivel?: "verde" | "amarillo" | "rojo";
  explicacion?: string;
  estado: "pendiente" | "procesando" | "listo";
};

// CSV ejemplo (template descargable)
const CSV_TEMPLATE = `ramo,ciudad,monto_reclamado,suma_asegurada,dias_reporte,antiguedad_poliza_dias,reclamos_ult_12m,documentos_completos,proveedor_lista_restrictiva,proveedor_casos_anio,placa_reincidente,beneficiario_distinto_titular,hora_madrugada
Vehículos,Quito,3200,25000,1,420,0,true,false,4,false,false,false
Vehículos,Guayaquil,8500,30000,12,600,1,true,false,8,false,false,false
Vehículos,Cuenca,9800,22000,4,90,3,false,false,15,true,true,true
Vehículos,Quito,12000,28000,3,200,1,true,true,35,false,false,false
Vehículos,Guayaquil,23500,25000,7,18,1,false,false,12,false,true,true
Vida,Quito,15000,50000,2,180,0,true,false,2,false,false,false
Salud,Guayaquil,4500,20000,8,45,2,false,false,18,false,true,false
`;

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

function toBool(v: string) {
  return ["true", "1", "si", "sí", "yes"].includes(v.toLowerCase());
}

function rowToCaso(r: Record<string, string>): CasoInput {
  return {
    ramo: r.ramo || "Vehículos",
    ciudad: r.ciudad || "Quito",
    monto_reclamado: Number(r.monto_reclamado || 0),
    suma_asegurada: Number(r.suma_asegurada || 0),
    dias_reporte: Number(r.dias_reporte || 0),
    antiguedad_poliza_dias: Number(r.antiguedad_poliza_dias || 0),
    reclamos_ult_12m: Number(r.reclamos_ult_12m || 0),
    documentos_completos: toBool(r.documentos_completos || "true"),
    proveedor_lista_restrictiva: toBool(r.proveedor_lista_restrictiva || "false"),
    proveedor_casos_anio: Number(r.proveedor_casos_anio || 0),
    placa_reincidente: toBool(r.placa_reincidente || "false"),
    beneficiario_distinto_titular: toBool(r.beneficiario_distinto_titular || "false"),
    hora_madrugada: toBool(r.hora_madrugada || "false"),
  };
}

function LotePage() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [procesando, setProcesando] = useState(false);
  const [idxActual, setIdxActual] = useState(-1);
  const [velocidad, setVelocidad] = useState(500); // ms entre filas
  const cancelRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const listos = filas.filter((f) => f.estado === "listo");
    return {
      total: filas.length,
      procesados: listos.length,
      rojo: listos.filter((f) => f.nivel === "rojo").length,
      amarillo: listos.filter((f) => f.nivel === "amarillo").length,
      verde: listos.filter((f) => f.nivel === "verde").length,
    };
  }, [filas]);

  const onFile = async (file: File) => {
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      toast.error("CSV vacío o inválido");
      return;
    }
    setFileName(file.name);
    setFilas(
      rows.map((r, i) => ({ idx: i, raw: r, caso: rowToCaso(r), estado: "pendiente" })),
    );
    setIdxActual(-1);
    toast.success(`Cargadas ${rows.length} filas de ${file.name}`);
  };

  const descargarTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "siniestros_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const ejecutar = async () => {
    if (filas.length === 0) return;
    setProcesando(true);
    cancelRef.current = false;
    for (let i = 0; i < filas.length; i++) {
      if (cancelRef.current) break;
      setIdxActual(i);
      setFilas((prev) => prev.map((f, k) => (k === i ? { ...f, estado: "procesando" } : f)));
      await new Promise((r) => setTimeout(r, velocidad));
      const reglas = evaluarCaso(filas[i].caso);
      const score = Math.min(100, reglas.reduce((acc, r) => (r.activada ? acc + r.puntos : acc), 0));
      const nivel = nivelDeScore(score);
      const explicacion = explicar(reglas, score);
      setFilas((prev) =>
        prev.map((f, k) => (k === i ? { ...f, reglas, score, nivel, explicacion, estado: "listo" } : f)),
      );
    }
    setProcesando(false);
    setIdxActual(-1);
  };

  const detener = () => {
    cancelRef.current = true;
    setProcesando(false);
  };

  const reset = () => {
    cancelRef.current = true;
    setProcesando(false);
    setFilas((prev) => prev.map((f) => ({ ...f, estado: "pendiente", reglas: undefined, score: undefined, nivel: undefined, explicacion: undefined })));
    setIdxActual(-1);
  };

  const descargarResultados = () => {
    const headers = ["ramo", "ciudad", "monto_reclamado", "score", "nivel_riesgo", "reglas_activadas", "explicacion"];
    const rows = filas.filter((f) => f.estado === "listo").map((f) => {
      const activas = (f.reglas ?? []).filter((r) => r.activada).map((r) => r.nombre).join(" | ");
      return [
        f.caso.ramo, f.caso.ciudad, f.caso.monto_reclamado, f.score ?? "", f.nivel ?? "",
        `"${activas}"`, `"${(f.explicacion ?? "").replace(/"/g, "'").replace(/\*\*/g, "")}"`,
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resultados_${fileName || "lote"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const guardarEnBaseDatos = async () => {
    const listos = filas.filter((f) => f.estado === "listo");
    if (listos.length === 0) return;
    const inserts = listos.map((f) => ({
      ramo: f.caso.ramo,
      ciudad: f.caso.ciudad,
      monto_reclamado: f.caso.monto_reclamado,
      score_riesgo: f.score,
      nivel_riesgo: f.nivel,
      reglas_activadas: (f.reglas ?? []).filter((r) => r.activada).map((r) => ({
        id: r.id, nombre: r.nombre, puntos: r.puntos, detalle: r.detalle,
      })),
      explicacion_ia: f.explicacion,
      descripcion: `Carga lote: ${fileName || "csv"} fila ${f.idx + 1}`,
      estado: "reserva",
      fecha_reporte: new Date().toISOString().slice(0, 10),
      documentos_completos: f.caso.documentos_completos,
    }));
    const { error } = await supabase.from("siniestros").insert(inserts);
    if (error) toast.error("Error al guardar: " + error.message);
    else toast.success(`${listos.length} casos guardados en la base`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          Análisis por lote (CSV)
        </h1>
        <p className="text-sm text-muted-foreground">
          Carga un archivo CSV de siniestros y mira al agente analizar cada fila en vivo — regla por regla.
        </p>
      </div>

      {/* Carga de archivo */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="default" className="gap-2">
              <Upload className="h-4 w-4" /> Cargar CSV
            </Button>
            <Button variant="outline" onClick={descargarTemplate} className="gap-2">
              <Download className="h-4 w-4" /> Plantilla CSV
            </Button>
            {fileName && (
              <Badge variant="secondary" className="gap-1.5">
                <FileSpreadsheet className="h-3 w-3" /> {fileName} · {filas.length} filas
              </Badge>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Velocidad</span>
              <select
                value={velocidad}
                onChange={(e) => setVelocidad(Number(e.target.value))}
                disabled={procesando}
                className="text-xs rounded-md border bg-background px-2 py-1"
              >
                <option value={1000}>Lenta (1s)</option>
                <option value={500}>Normal</option>
                <option value={200}>Rápida</option>
                <option value={50}>Turbo</option>
              </select>
            </div>
          </div>

          {filas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {!procesando ? (
                <Button onClick={ejecutar} className="gap-2">
                  <Play className="h-4 w-4" /> Ejecutar análisis
                </Button>
              ) : (
                <Button onClick={detener} variant="destructive" className="gap-2">
                  <Pause className="h-4 w-4" /> Detener
                </Button>
              )}
              <Button onClick={reset} variant="outline" disabled={procesando} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reiniciar
              </Button>
              {stats.procesados > 0 && (
                <>
                  <Button onClick={descargarResultados} variant="outline" disabled={procesando} className="gap-2">
                    <Download className="h-4 w-4" /> Descargar resultados
                  </Button>
                  <Button onClick={guardarEnBaseDatos} variant="outline" disabled={procesando} className="gap-2">
                    <Save className="h-4 w-4" /> Guardar en base
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats en vivo */}
      {filas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total" valor={stats.total} icon={<FileSpreadsheet className="h-4 w-4" />} />
          <StatCard label="Procesados" valor={`${stats.procesados}/${stats.total}`} icon={<Cpu className="h-4 w-4 text-primary" />} />
          <StatCard label="Rojos" valor={stats.rojo} icon={<AlertOctagon className="h-4 w-4 text-risk-rojo" />} />
          <StatCard label="Amarillos" valor={stats.amarillo} icon={<AlertTriangle className="h-4 w-4 text-risk-amarillo" />} />
          <StatCard label="Verdes" valor={stats.verde} icon={<ShieldCheck className="h-4 w-4 text-risk-verde" />} />
        </div>
      )}

      {/* Barra de progreso */}
      {filas.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso del lote</span>
            <span>{stats.procesados} / {stats.total}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(stats.procesados / Math.max(1, stats.total)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stream en vivo */}
      {filas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Stream de análisis en vivo
              {procesando && (
                <Badge variant="secondary" className="ml-2 gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Fila {idxActual + 1}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filas.map((f) => {
                const activa = f.idx === idxActual;
                const reglas = f.reglas ?? [];
                const activas = reglas.filter((r) => r.activada);
                return (
                  <div
                    key={f.idx}
                    className={`rounded-md border px-3 py-2 transition-all ${
                      f.estado === "pendiente" ? "opacity-50 bg-muted/20" : ""
                    } ${activa ? "ring-2 ring-primary border-primary" : ""} ${
                      f.estado === "listo" && f.nivel === "rojo" ? "border-risk-rojo/50 bg-risk-rojo/5" : ""
                    } ${f.estado === "listo" && f.nivel === "amarillo" ? "border-risk-amarillo/50 bg-risk-amarillo/5" : ""} ${
                      f.estado === "listo" && f.nivel === "verde" ? "border-risk-verde/40 bg-risk-verde/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-muted-foreground w-8">#{f.idx + 1}</span>
                      <span className="text-sm font-medium">{f.caso.ramo} · {f.caso.ciudad}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        ${f.caso.monto_reclamado.toLocaleString()}
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        {f.estado === "procesando" && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {f.estado === "listo" && (
                          <>
                            <span className="text-sm font-bold font-mono tabular-nums">{f.score}</span>
                            <RiskBadge nivel={f.nivel!} />
                          </>
                        )}
                      </div>
                    </div>
                    {f.estado === "listo" && activas.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {activas.map((r) => (
                          <Badge key={r.id} variant="outline" className="text-[10px]">
                            {r.nombre} <span className="ml-1 text-risk-rojo font-bold">+{r.puntos}</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                    {f.estado === "listo" && activa === false && f.explicacion && f.nivel !== "verde" && (
                      <p className="text-[11px] text-muted-foreground italic mt-1.5 line-clamp-2">
                        {f.explicacion.replace(/\*\*/g, "")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {filas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Carga un CSV de siniestros para empezar. Descarga la plantilla para ver las columnas esperadas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, valor, icon }: { label: string; valor: number | string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between text-muted-foreground mb-1">
          <span className="text-[10px] uppercase tracking-wide">{label}</span>
          {icon}
        </div>
        <div className="text-xl font-bold tabular-nums">{valor}</div>
      </CardContent>
    </Card>
  );
}
