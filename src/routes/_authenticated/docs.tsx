import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, BookOpen, Database, Cpu, Network, Layers, Shield, Workflow } from "lucide-react";

export const Route = createFileRoute("/_authenticated/docs")({
  head: () => ({
    meta: [
      { title: "Documentación · FraudIA Claims" },
      { name: "description", content: "Arquitectura, modelo de datos, reglas y limitaciones del sistema." },
    ],
  }),
  component: DocsPage,
});

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-primary">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

function DocsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Documentación del sistema
        </h1>
        <p className="text-sm text-muted-foreground">
          Modelo, reglas, datos, limitaciones y propuesta de arquitectura escalable.
        </p>
      </div>

      {/* Visión general */}
      <Section icon={<Layers className="h-4 w-4" />} title="1. Visión general">
        <p>
          <strong className="text-foreground">FraudIA Claims</strong> es un sistema analítico de apoyo a la detección
          temprana de fraude en siniestros para Aseguradora del Sur. Combina un motor de reglas explicables, un score
          0–100 por siniestro, una clasificación en tres niveles de riesgo y un agente conversacional que permite
          consultas en lenguaje natural.
        </p>
        <div className="rounded-md border border-risk-amarillo/30 bg-risk-amarillo/10 p-3 flex gap-2 text-xs">
          <AlertTriangle className="h-4 w-4 text-risk-amarillo-foreground shrink-0 mt-0.5" />
          <p className="text-risk-amarillo-foreground">
            Las alertas y scores son <strong>apoyo analítico</strong>. La decisión final corresponde siempre al
            analista humano. Los datos cargados son sintéticos, con fines de demostración.
          </p>
        </div>
      </Section>

      {/* Arquitectura */}
      <Section icon={<Network className="h-4 w-4" />} title="2. Arquitectura">
        <pre className="text-xs bg-muted/50 rounded-md p-4 overflow-x-auto font-mono leading-snug">
{`┌────────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│ Datos          │───▶│ Motor de reglas  │───▶│ Postgres / RLS       │
│ sintéticos     │    │ + scoring 0-100  │    │ score + nivel_riesgo │
└────────────────┘    └──────────────────┘    └──────────┬───────────┘
                                                         │
                       ┌──────────────────┐              │
                       │ Agente IA        │◀─── tools ───┤
                       │ Gemini 2.5 Flash │              │
                       └────────┬─────────┘              │
                                │                        │
                                ▼                        ▼
                       ┌──────────────────────────────────────┐
                       │ UI Analista                          │
                       │ Dashboard · Bandeja · Detalle · Chat │
                       └──────────────────────────────────────┘`}
        </pre>
        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <InfoTile label="Frontend" value="React 19 + TanStack Start v1" />
          <InfoTile label="UI" value="Tailwind v4 + shadcn/ui + AI Elements" />
          <InfoTile label="Backend" value="Lovable Cloud (Postgres + Auth + RLS)" />
          <InfoTile label="IA" value="Lovable AI Gateway · Gemini 2.5 Flash" />
        </div>
      </Section>

      {/* Modelo de datos */}
      <Section icon={<Database className="h-4 w-4" />} title="3. Modelo de datos">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tabla</TableHead>
              <TableHead>Propósito</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ["asegurados", "Maestro de clientes (segmento, antigüedad, score_cliente)"],
              ["polizas", "Pólizas vigentes por ramo, prima y suma asegurada"],
              ["proveedores", "Talleres / clínicas / peritos + lista restrictiva"],
              ["siniestros", "Tabla central: reclamación + score_riesgo + reglas_activadas + explicacion_ia"],
              ["documentos", "Documentos del expediente y flags de inconsistencia"],
              ["alertas_log", "Historial de alertas emitidas (amarillas y rojas)"],
              ["chat_history", "Conversaciones del analista con el agente IA (RLS por usuario)"],
              ["config", "Parámetros editables (umbrales y pesos de reglas)"],
            ].map(([t, d]) => (
              <TableRow key={t}>
                <TableCell className="font-mono text-xs">{t}</TableCell>
                <TableCell className="text-xs">{d}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      {/* Reglas y scoring */}
      <Section icon={<Cpu className="h-4 w-4" />} title="4. Motor de reglas y scoring">
        <p>
          El score (0–100) se calcula por suma ponderada de reglas evaluadas sobre cada siniestro. Cada regla
          activada se persiste en <code className="text-foreground">reglas_activadas</code> (JSONB) con su peso y
          descripción — esto hace la alerta <strong className="text-foreground">explicable</strong>.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Regla</TableHead>
              <TableHead>Señal</TableHead>
              <TableHead className="text-right">Peso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ["Documentación incompleta", "documentos_completos = false", 15],
              ["Proveedor en lista restrictiva", "proveedores.en_lista_restrictiva", 25],
              ["Proveedor alta concentración", "casos_observados_anio > p90", 10],
              ["Reincidencia del asegurado", "reclamos_ult_12m ≥ 3", 15],
              ["Mora actual del asegurado", "asegurados.mora_actual", 10],
              ["Reporte tardío", "fecha_reporte − fecha_ocurrencia > 7 d", 10],
              ["Similitud con otro siniestro", "match placa / chasis / beneficiario", 20],
              ["Monto atípico vs. suma asegurada", "monto_reclamado / suma_asegurada > 0.8", 15],
            ].map(([r, s, w]) => (
              <TableRow key={r as string}>
                <TableCell className="text-xs">{r}</TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground">{s}</TableCell>
                <TableCell className="text-right font-mono text-xs">+{w}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="pt-3 space-y-2">
          <p className="text-xs uppercase tracking-wide text-foreground font-semibold">Umbrales</p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-risk-verde text-risk-verde-foreground">Verde · 0–40</Badge>
            <Badge className="bg-risk-amarillo text-risk-amarillo-foreground">Amarillo · 41–75</Badge>
            <Badge className="bg-risk-rojo text-risk-rojo-foreground">Rojo · 76–100</Badge>
          </div>
        </div>
      </Section>

      {/* Agente IA */}
      <Section icon={<Workflow className="h-4 w-4" />} title="5. Agente IA — consultas en lenguaje natural">
        <p>
          Disponible en <code className="text-foreground">/chat</code> y como FAB flotante en toda la app.
          El modelo nunca inventa datos: si necesita información, llama a una tool.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool</TableHead>
              <TableHead>Función</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ["listar_siniestros", "Filtra por nivel de riesgo, ramo, ciudad"],
              ["detalle_siniestro", "Trae expediente completo por UUID"],
              ["ranking_proveedores", "Top proveedores por casos observados"],
              ["stats_dashboard", "KPIs globales"],
              ["buscar_similares", "Match por placa / chasis / beneficiario"],
              ["alertas_recientes", "Últimas alertas emitidas"],
            ].map(([n, d]) => (
              <TableRow key={n}>
                <TableCell className="font-mono text-xs">{n}</TableCell>
                <TableCell className="text-xs">{d}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      {/* Limitaciones */}
      <Section icon={<Shield className="h-4 w-4" />} title="6. Limitaciones">
        <Accordion type="single" collapsible className="w-full">
          {[
            ["Datos sintéticos", "Los registros son de demostración y no representan operaciones reales de la aseguradora."],
            ["Apoyo, no decisión", "El score no determina fraude; sólo prioriza casos para revisión humana."],
            ["Reglas heurísticas", "No se usa modelo ML supervisado en esta versión. La arquitectura permite enchufar uno (ver sección 7)."],
            ["Sin OCR", "Las inconsistencias documentales provienen de un flag previo, no de análisis automático de imágenes."],
            ["Idioma", "El agente responde en español; otros idiomas pueden degradar la calidad de las respuestas."],
            ["Sin reentrenamiento automático", "Los pesos de reglas son fijos; ajustarlos requiere editar la tabla config."],
          ].map(([t, d], i) => (
            <AccordionItem key={i} value={`l-${i}`}>
              <AccordionTrigger className="text-sm">{t}</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">{d}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* Arquitectura escalable */}
      <Section icon={<Network className="h-4 w-4" />} title="7. Arquitectura escalable (roadmap)">
        <pre className="text-xs bg-muted/50 rounded-md p-4 overflow-x-auto font-mono leading-snug">
{`[Fuentes reales]            [Procesamiento]          [Consumo]
core asegurador  ──────▶ ingest workers     ─────▶ feature store
siniestros API           (Cloud Functions)            │
documentos (OCR) ──────▶ Queue (pub/sub)    ─────▶ Modelo ML supervisado
emails / call-center                                  │
                                                      ▼
                                            score + explicabilidad
                                                      │
                                                      ▼
                                          UI analista · API externa`}
        </pre>
        <ol className="list-decimal pl-5 space-y-1.5 text-xs">
          <li>Reemplazar datos sintéticos por ingestas reales del core asegurador (CDC o batch nocturno).</li>
          <li>Añadir modelo supervisado (XGBoost / LightGBM) alimentado por las reglas como <em>features</em> + histórico etiquetado por el área de fraude.</li>
          <li>Mantener la explicabilidad mediante SHAP values además de las reglas duras.</li>
          <li>Mover el motor de reglas a un worker dedicado (cola + idempotencia) para escalar a millones de siniestros/mes.</li>
          <li>Cifrado adicional para PII y enmascaramiento en queries del agente IA.</li>
          <li>Auditoría completa: cada decisión del analista (aceptar/rechazar alerta) se loguea para feedback supervisado.</li>
        </ol>
      </Section>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
