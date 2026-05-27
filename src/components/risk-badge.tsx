import { cn } from "@/lib/utils";

export type NivelRiesgo = "verde" | "amarillo" | "rojo" | string | null | undefined;

const LABEL: Record<string, string> = {
  verde: "Verde",
  amarillo: "Amarillo",
  rojo: "Rojo",
};

export function RiskBadge({ nivel, score, className }: { nivel: NivelRiesgo; score?: number | null; className?: string }) {
  const key = (nivel ?? "verde").toLowerCase();
  const cls =
    key === "rojo"
      ? "bg-risk-rojo text-risk-rojo-foreground"
      : key === "amarillo"
      ? "bg-risk-amarillo text-risk-amarillo-foreground"
      : "bg-risk-verde text-risk-verde-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", cls, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
      {LABEL[key] ?? key}
      {typeof score === "number" && <span className="opacity-80">· {score}</span>}
    </span>
  );
}
