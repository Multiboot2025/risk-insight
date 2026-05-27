import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/risk-badge";

export const Route = createFileRoute("/_authenticated/reportes")({
  head: () => ({ meta: [{ title: "Reportes · FraudIA Claims" }] }),
  component: ReportesPage,
});

function printReport(s: any) {
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Reporte ${s.id_siniestro}</title>
  <style>body{font-family:system-ui,Arial;padding:32px;color:#111;max-width:780px;margin:auto}
  h1{margin:0 0 4px}h2{margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:4px}
  .meta{color:#666;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:8px}
  td,th{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:13px}
  .pill{display:inline-block;padding:2px 10px;border-radius:99px;font-weight:600;font-size:12px}
  .v{background:#d1fae5;color:#065f46}.a{background:#fef3c7;color:#92400e}.r{background:#fee2e2;color:#991b1b}
  .warn{background:#fff7ed;border-left:4px solid #f59e0b;padding:8px 12px;margin-top:16px;font-size:12px;color:#78350f}
  </style></head><body>
  <h1>Reporte de siniestro · ${s.id_siniestro}</h1>
  <div class="meta">FraudIA Claims · Generado ${new Date().toLocaleString("es-EC")}</div>
  <h2>Resumen</h2>
  <table>
    <tr><th>Ramo</th><td>${s.ramo ?? "-"}</td><th>Cobertura</th><td>${s.cobertura ?? "-"}</td></tr>
    <tr><th>Fecha ocurrencia</th><td>${s.fecha_ocurrencia ?? "-"}</td><th>Fecha reporte</th><td>${s.fecha_reporte ?? "-"}</td></tr>
    <tr><th>Sucursal</th><td>${s.sucursal ?? "-"}</td><th>Ciudad</th><td>${s.ciudad ?? "-"}</td></tr>
    <tr><th>Monto reclamado</th><td>USD ${s.monto_reclamado ?? 0}</td><th>Monto estimado</th><td>USD ${s.monto_estimado ?? 0}</td></tr>
    <tr><th>Estado</th><td>${s.estado ?? "-"}</td><th>Score riesgo</th><td>${s.score_riesgo ?? "-"} (<span class="pill ${s.nivel_riesgo==="rojo"?"r":s.nivel_riesgo==="amarillo"?"a":"v"}">${s.nivel_riesgo ?? "verde"}</span>)</td></tr>
  </table>
  <h2>Descripción</h2><p>${s.descripcion ?? "-"}</p>
  ${s.explicacion_ia ? `<h2>Explicación IA</h2><p>${s.explicacion_ia}</p>` : ""}
  ${Array.isArray(s.reglas_activadas) && s.reglas_activadas.length ? `<h2>Reglas activadas</h2><ul>${s.reglas_activadas.map((r:string)=>`<li>${r}</li>`).join("")}</ul>` : ""}
  <div class="warn"><strong>Aviso:</strong> El nivel de riesgo es apoyo analítico, no determina fraude. La decisión final corresponde al analista humano.</div>
  <script>window.print()</script></body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

function ReportesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reportes-siniestros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("siniestros")
        .select("*")
        .order("score_riesgo", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-sm text-muted-foreground">Genera un informe imprimible por siniestro</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Siniestros</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Ramo</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead className="text-right">Reclamado</TableHead>
                  <TableHead>Riesgo</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((s: any) => (
                  <TableRow key={s.id_siniestro}>
                    <TableCell className="font-mono text-xs">{s.id_siniestro}</TableCell>
                    <TableCell>{s.ramo}</TableCell>
                    <TableCell>{s.ciudad}</TableCell>
                    <TableCell className="text-right">USD {Number(s.monto_reclamado ?? 0).toLocaleString()}</TableCell>
                    <TableCell><RiskBadge nivel={s.nivel_riesgo} score={s.score_riesgo} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => printReport(s)}>
                        <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
