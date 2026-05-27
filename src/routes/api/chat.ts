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
  top_siniestros_riesgo: tool({
    description: "Devuelve los N siniestros con mayor score de riesgo (top riesgo de fraude). Por defecto 10.",
    inputSchema: z.object({ limit: z.number().min(1).max(50).default(10) }),
    execute: async ({ limit }) => {
      const { data, error } = await supabaseAdmin
        .from("siniestros")
        .select("id_siniestro,ramo,ciudad,id_proveedor,id_asegurado,monto_reclamado,score_riesgo,nivel_riesgo,reglas_activadas,explicacion_ia,fecha_ocurrencia,vehiculo_placa")
        .order("score_riesgo", { ascending: false })
        .limit(limit);
      if (error) return { error: error.message };
      return { siniestros: data };
    },
  }),
  alertas_por_ciudad: tool({
    description: "Agrupa los siniestros amarillos y rojos por ciudad y devuelve el conteo y monto total por ciudad, ordenado desc.",
    inputSchema: z.object({}),
    execute: async () => {
      const { data, error } = await supabaseAdmin
        .from("siniestros")
        .select("ciudad,nivel_riesgo,monto_reclamado,score_riesgo")
        .in("nivel_riesgo", ["rojo", "amarillo"]);
      if (error) return { error: error.message };
      const map = new Map<string, { ciudad: string; total: number; rojos: number; amarillos: number; monto: number }>();
      (data ?? []).forEach((s: any) => {
        const k = s.ciudad ?? "Sin ciudad";
        const e = map.get(k) ?? { ciudad: k, total: 0, rojos: 0, amarillos: 0, monto: 0 };
        e.total++;
        if (s.nivel_riesgo === "rojo") e.rojos++; else e.amarillos++;
        e.monto += Number(s.monto_reclamado ?? 0);
        map.set(k, e);
      });
      return { ciudades: [...map.values()].sort((a, b) => b.total - a.total) };
    },
  }),
  alertas_por_ramo: tool({
    description: "Porcentaje y conteo de siniestros sospechosos (amarillo+rojo) por ramo, sobre el total del ramo.",
    inputSchema: z.object({}),
    execute: async () => {
      const { data, error } = await supabaseAdmin.from("siniestros").select("ramo,nivel_riesgo");
      if (error) return { error: error.message };
      const map = new Map<string, { ramo: string; total: number; sospechosos: number; rojos: number }>();
      (data ?? []).forEach((s: any) => {
        const k = s.ramo ?? "Sin ramo";
        const e = map.get(k) ?? { ramo: k, total: 0, sospechosos: 0, rojos: 0 };
        e.total++;
        if (s.nivel_riesgo === "rojo" || s.nivel_riesgo === "amarillo") e.sospechosos++;
        if (s.nivel_riesgo === "rojo") e.rojos++;
        map.set(k, e);
      });
      const rows = [...map.values()].map((r) => ({ ...r, porcentaje: r.total ? Math.round((r.sospechosos / r.total) * 100) : 0 }));
      return { ramos: rows.sort((a, b) => b.porcentaje - a.porcentaje) };
    },
  }),
  proveedores_con_mas_alertas: tool({
    description: "Proveedores que concentran más siniestros sospechosos (amarillos/rojos). Cruza siniestros con proveedores.",
    inputSchema: z.object({ limit: z.number().min(1).max(50).default(10) }),
    execute: async ({ limit }) => {
      const { data, error } = await supabaseAdmin
        .from("siniestros")
        .select("id_proveedor,nivel_riesgo,monto_reclamado")
        .in("nivel_riesgo", ["rojo", "amarillo"]);
      if (error) return { error: error.message };
      const map = new Map<string, { id_proveedor: string; alertas: number; rojos: number; monto: number }>();
      (data ?? []).forEach((s: any) => {
        if (!s.id_proveedor) return;
        const e = map.get(s.id_proveedor) ?? { id_proveedor: s.id_proveedor, alertas: 0, rojos: 0, monto: 0 };
        e.alertas++;
        if (s.nivel_riesgo === "rojo") e.rojos++;
        e.monto += Number(s.monto_reclamado ?? 0);
        map.set(s.id_proveedor, e);
      });
      const top = [...map.values()].sort((a, b) => b.alertas - a.alertas).slice(0, limit);
      const ids = top.map((t) => t.id_proveedor);
      const { data: provs } = await supabaseAdmin.from("proveedores").select("*").in("id_proveedor", ids);
      const provMap = new Map((provs ?? []).map((p: any) => [p.id_proveedor, p]));
      return { proveedores: top.map((t) => ({ ...t, info: provMap.get(t.id_proveedor) ?? null })) };
    },
  }),
  asegurados_frecuentes: tool({
    description: "Asegurados con mayor frecuencia de reclamos en los últimos 12 meses.",
    inputSchema: z.object({ limit: z.number().min(1).max(50).default(10) }),
    execute: async ({ limit }) => {
      const { data, error } = await supabaseAdmin
        .from("asegurados")
        .select("id_asegurado,nombre_anon,ciudad,reclamos_ult_12m,score_cliente,segmento")
        .order("reclamos_ult_12m", { ascending: false })
        .limit(limit);
      if (error) return { error: error.message };
      return { asegurados: data };
    },
  }),
  documentos_faltantes_criticos: tool({
    description: "Lista siniestros críticos (rojos) con documentos incompletos o documentos con inconsistencia/no entregados.",
    inputSchema: z.object({ limit: z.number().min(1).max(50).default(20) }),
    execute: async ({ limit }) => {
      const { data, error } = await supabaseAdmin
        .from("siniestros")
        .select("id_siniestro,ramo,ciudad,monto_reclamado,score_riesgo,documentos_completos")
        .eq("nivel_riesgo", "rojo")
        .order("score_riesgo", { ascending: false })
        .limit(limit);
      if (error) return { error: error.message };
      const ids = (data ?? []).map((s: any) => s.id_siniestro);
      const { data: docs } = await supabaseAdmin
        .from("documentos")
        .select("id_siniestro,tipo_documento,entregado,inconsistencia_detectada,legible,observacion")
        .in("id_siniestro", ids);
      const byCase = new Map<string, any[]>();
      (docs ?? []).forEach((d: any) => {
        const arr = byCase.get(d.id_siniestro) ?? [];
        if (!d.entregado || d.inconsistencia_detectada || !d.legible) arr.push(d);
        byCase.set(d.id_siniestro, arr);
      });
      return { casos: (data ?? []).map((s: any) => ({ ...s, documentos_problema: byCase.get(s.id_siniestro) ?? [] })) };
    },
  }),
  montos_atipicos: tool({
    description: "Siniestros con monto reclamado atípico respecto a su suma asegurada (>80% de la suma o muy alejado de la media del ramo).",
    inputSchema: z.object({ limit: z.number().min(1).max(50).default(15) }),
    execute: async ({ limit }) => {
      const { data: sinis, error } = await supabaseAdmin
        .from("siniestros")
        .select("id_siniestro,ramo,ciudad,monto_reclamado,id_poliza,score_riesgo,nivel_riesgo");
      if (error) return { error: error.message };
      const { data: pols } = await supabaseAdmin.from("polizas").select("id_poliza,suma_asegurada");
      const polMap = new Map((pols ?? []).map((p: any) => [p.id_poliza, Number(p.suma_asegurada ?? 0)]));
      // media por ramo
      const ramoSum = new Map<string, { suma: number; n: number }>();
      (sinis ?? []).forEach((s: any) => {
        const r = ramoSum.get(s.ramo) ?? { suma: 0, n: 0 };
        r.suma += Number(s.monto_reclamado ?? 0); r.n++;
        ramoSum.set(s.ramo, r);
      });
      const medias = new Map([...ramoSum.entries()].map(([k, v]) => [k, v.n ? v.suma / v.n : 0]));
      const atipicos = (sinis ?? []).map((s: any) => {
        const suma = polMap.get(s.id_poliza) ?? 0;
        const ratio = suma > 0 ? Number(s.monto_reclamado ?? 0) / suma : 0;
        const media = medias.get(s.ramo) ?? 0;
        const desvMedia = media > 0 ? Number(s.monto_reclamado ?? 0) / media : 0;
        return { ...s, suma_asegurada: suma, ratio_vs_suma: Math.round(ratio * 100) / 100, veces_media_ramo: Math.round(desvMedia * 100) / 100 };
      })
        .filter((s) => s.ratio_vs_suma > 0.8 || s.veces_media_ramo > 2.5)
        .sort((a, b) => b.ratio_vs_suma - a.ratio_vs_suma)
        .slice(0, limit);
      return { casos: atipicos };
    },
  }),
  siniestros_poliza_nueva: tool({
    description: "Siniestros ocurridos en los primeros 30 días desde el inicio de la póliza.",
    inputSchema: z.object({ limit: z.number().min(1).max(50).default(20) }),
    execute: async ({ limit }) => {
      const { data: sinis, error } = await supabaseAdmin
        .from("siniestros")
        .select("id_siniestro,id_poliza,fecha_ocurrencia,ramo,ciudad,monto_reclamado,score_riesgo,nivel_riesgo");
      if (error) return { error: error.message };
      const { data: pols } = await supabaseAdmin.from("polizas").select("id_poliza,fecha_inicio");
      const polMap = new Map((pols ?? []).map((p: any) => [p.id_poliza, p.fecha_inicio]));
      const res = (sinis ?? []).map((s: any) => {
        const inicio = polMap.get(s.id_poliza);
        if (!inicio || !s.fecha_ocurrencia) return null;
        const dias = Math.floor((new Date(s.fecha_ocurrencia).getTime() - new Date(inicio).getTime()) / 86400000);
        return { ...s, dias_desde_inicio: dias, fecha_inicio_poliza: inicio };
      }).filter((s: any) => s && s.dias_desde_inicio >= 0 && s.dias_desde_inicio <= 30)
        .sort((a: any, b: any) => a.dias_desde_inicio - b.dias_desde_inicio)
        .slice(0, limit);
      return { casos: res };
    },
  }),
  patrones_reglas: tool({
    description: "Cuenta cuántas veces se activa cada regla de fraude en siniestros sospechosos, para detectar patrones recurrentes.",
    inputSchema: z.object({}),
    execute: async () => {
      const { data, error } = await supabaseAdmin
        .from("siniestros")
        .select("reglas_activadas,nivel_riesgo")
        .in("nivel_riesgo", ["rojo", "amarillo"]);
      if (error) return { error: error.message };
      const map = new Map<string, { regla: string; veces: number }>();
      (data ?? []).forEach((s: any) => {
        const arr = Array.isArray(s.reglas_activadas) ? s.reglas_activadas : [];
        arr.forEach((r: any) => {
          const nombre = typeof r === "string" ? r : (r?.nombre ?? r?.id ?? "regla");
          const e = map.get(nombre) ?? { regla: nombre, veces: 0 };
          e.veces++;
          map.set(nombre, e);
        });
      });
      return { patrones: [...map.values()].sort((a, b) => b.veces - a.veces) };
    },
  }),
  resumen_ejecutivo_criticos: tool({
    description: "Resumen ejecutivo de los casos críticos (rojos): totales, monto en riesgo, top ramos, top ciudades y top proveedores.",
    inputSchema: z.object({}),
    execute: async () => {
      const { data, error } = await supabaseAdmin
        .from("siniestros")
        .select("ramo,ciudad,id_proveedor,monto_reclamado,score_riesgo")
        .eq("nivel_riesgo", "rojo");
      if (error) return { error: error.message };
      const arr = data ?? [];
      const monto = arr.reduce((a, s: any) => a + Number(s.monto_reclamado ?? 0), 0);
      const group = (k: string) => {
        const m = new Map<string, number>();
        arr.forEach((s: any) => m.set(s[k] ?? "?", (m.get(s[k] ?? "?") ?? 0) + 1));
        return [...m.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n).slice(0, 5);
      };
      return {
        total_criticos: arr.length,
        monto_en_riesgo: monto,
        score_promedio: arr.length ? Math.round(arr.reduce((a, s: any) => a + (s.score_riesgo ?? 0), 0) / arr.length) : 0,
        top_ramos: group("ramo"),
        top_ciudades: group("ciudad"),
        top_proveedores: group("id_proveedor"),
      };
    },
  }),
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages }: { messages: UIMessage[] } = await request.json();

        // Auth: validar bearer token y obtener userId
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.replace(/^Bearer\s+/i, "");
        let userId: string | null = null;
        if (token) {
          const { data } = await supabaseAdmin.auth.getUser(token);
          userId = data.user?.id ?? null;
        }

        // Persistir último mensaje del usuario
        if (userId) {
          const last = messages[messages.length - 1];
          const userText = last?.parts
            ?.filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join("") ?? "";
          if (last?.role === "user" && userText) {
            await supabaseAdmin.from("chat_history").insert({
              user_id: userId,
              role: "user",
              content: userText,
            });
          }
        }

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
          onFinish: async ({ text }) => {
            if (userId && text) {
              await supabaseAdmin.from("chat_history").insert({
                user_id: userId,
                role: "assistant",
                content: text,
              });
            }
          },
        });
        return result.toUIMessageStreamResponse();
      },
    },
  },
});
