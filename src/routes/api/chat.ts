import { createFileRoute } from "@tanstack/react-router";
import { streamText, convertToModelMessages, stepCountIs, tool, type UIMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const lovable = createOpenAICompatible({
  name: "lovable",
  baseURL: "https://ai.gateway.lovable.dev/v1",
  apiKey: process.env.LOVABLE_API_KEY,
});

const tools = {
  listar_siniestros: tool({
    description: "Lista siniestros filtrando por nivel de riesgo (verde/amarillo/rojo), ramo o ciudad. Devuelve hasta 20.",
    inputSchema: z.object({
      nivel_riesgo: z.enum(["verde", "amarillo", "rojo"]).optional(),
      ramo: z.string().optional(),
      ciudad: z.string().optional(),
    }),
    execute: async ({ nivel_riesgo, ramo, ciudad }) => {
      let q = supabaseAdmin.from("siniestros").select("id_siniestro,ramo,ciudad,monto_reclamado,nivel_riesgo,score_riesgo,estado").order("score_riesgo", { ascending: false }).limit(20);
      if (nivel_riesgo) q = q.eq("nivel_riesgo", nivel_riesgo);
      if (ramo) q = q.eq("ramo", ramo);
      if (ciudad) q = q.eq("ciudad", ciudad);
      const { data, error } = await q;
      if (error) return { error: error.message };
      return { count: data?.length ?? 0, siniestros: data };
    },
  }),
  detalle_siniestro: tool({
    description: "Trae el detalle completo de un siniestro por id_siniestro (UUID).",
    inputSchema: z.object({ id_siniestro: z.string() }),
    execute: async ({ id_siniestro }) => {
      const { data, error } = await supabaseAdmin.from("siniestros").select("*").eq("id_siniestro", id_siniestro).maybeSingle();
      if (error) return { error: error.message };
      return data ?? { error: "no encontrado" };
    },
  }),
  ranking_proveedores: tool({
    description: "Ranking de proveedores por casos observados y lista restrictiva.",
    inputSchema: z.object({ limit: z.number().min(1).max(50).default(10) }),
    execute: async ({ limit }) => {
      const { data, error } = await supabaseAdmin.from("proveedores").select("*").order("casos_observados_anio", { ascending: false }).limit(limit);
      if (error) return { error: error.message };
      return { proveedores: data };
    },
  }),
  stats_dashboard: tool({
    description: "KPIs globales: totales por nivel de riesgo, monto reclamado promedio y conteo de alertas.",
    inputSchema: z.object({}),
    execute: async () => {
      const { data: sinis } = await supabaseAdmin.from("siniestros").select("nivel_riesgo,monto_reclamado");
      const counts = { verde: 0, amarillo: 0, rojo: 0, total: 0, monto_promedio: 0 };
      let suma = 0;
      (sinis ?? []).forEach((s: any) => {
        counts.total++;
        suma += Number(s.monto_reclamado ?? 0);
        if (s.nivel_riesgo === "rojo") counts.rojo++;
        else if (s.nivel_riesgo === "amarillo") counts.amarillo++;
        else counts.verde++;
      });
      counts.monto_promedio = counts.total ? Math.round(suma / counts.total) : 0;
      const { count: alertas } = await supabaseAdmin.from("alertas_log").select("*", { count: "exact", head: true });
      return { ...counts, alertas: alertas ?? 0 };
    },
  }),
  buscar_similares: tool({
    description: "Busca siniestros similares por placa/chasis/beneficiario.",
    inputSchema: z.object({
      placa: z.string().optional(),
      chasis: z.string().optional(),
      beneficiario: z.string().optional(),
    }),
    execute: async (args) => {
      let q = supabaseAdmin.from("siniestros").select("id_siniestro,fecha_ocurrencia,monto_reclamado,nivel_riesgo,vehiculo_placa,beneficiario").limit(20);
      if (args.placa) q = q.eq("vehiculo_placa", args.placa);
      if (args.chasis) q = q.eq("vehiculo_chasis", args.chasis);
      if (args.beneficiario) q = q.ilike("beneficiario", `%${args.beneficiario}%`);
      const { data, error } = await q;
      if (error) return { error: error.message };
      return { matches: data };
    },
  }),
  alertas_recientes: tool({
    description: "Últimas alertas registradas (amarillas y rojas).",
    inputSchema: z.object({ limit: z.number().min(1).max(50).default(10) }),
    execute: async ({ limit }) => {
      const { data, error } = await supabaseAdmin.from("alertas_log").select("*").order("fecha", { ascending: false }).limit(limit);
      if (error) return { error: error.message };
      return { alertas: data };
    },
  }),
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages }: { messages: UIMessage[] } = await request.json();
        const result = streamText({
          model: lovable("google/gemini-2.5-flash"),
          system: `Eres el agente analítico de FraudIA Claims, un asistente para analistas antifraude de Aseguradora del Sur.
Tu rol: ayudar a explorar siniestros, proveedores y alertas usando las herramientas disponibles.
Reglas:
- Siempre que el usuario pida datos, USA las herramientas; no inventes.
- Responde en español, conciso, en formato markdown.
- Nivel de riesgo: verde 0–40, amarillo 41–75, rojo 76–100.
- IMPORTANTE: las alertas y scores son apoyo analítico; la decisión final corresponde al analista humano. Recuérdalo cuando sugieras revisión.`,
          messages: await convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(5),
        });
        return result.toUIMessageStreamResponse();
      },
    },
  },
});
