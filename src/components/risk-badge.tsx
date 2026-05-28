import { cn } from "@/lib/utils";

export type NivelRiesgo = "verde" | "amarillo" | "rojo" | string | null | undefined;

// Mapeo de niveles internos (DB) → etiquetas de negocio
// verde → Bajo · amarillo → Medio · rojo → Alto · rojo + score≥90 → Crítico
export function labelRiesgo(nivel: NivelRiesgo, score?: number | null): string {
  const key = (nivel ?? "verde").toLowerCase();
  if (key === "rojo") return typeof score === "number" && score >= 90 ? "Crítico" : "Alto";
  if (key === "amarillo") return "Medio";
  return "Bajo";
}

export function RiskBadge({ nivel, score, className }: { nivel: NivelRiesgo; score?: number | null; className?: string }) {
  const key = (nivel ?? "verde").toLowerCase();
  const critico = key === "rojo" && typeof score === "number" && score >= 90;
  const cls = critico
    ? "bg-risk-rojo text-risk-rojo-foreground ring-2 ring-risk-rojo/40"
    : key === "rojo"
    ? "bg-risk-rojo text-risk-rojo-foreground"
    : key === "amarillo"
    ? "bg-risk-amarillo text-risk-amarillo-foreground"
    : "bg-risk-verde text-risk-verde-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", cls, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
      {labelRiesgo(nivel, score)}
      {typeof score === "number" && <span className="opacity-80">· {score}</span>}
    </span>
  );
}
