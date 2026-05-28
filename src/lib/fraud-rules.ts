// Motor de reglas de fraude (client-side, para demo en vivo)
// Cada regla evalúa un caso y aporta puntos al score. Umbrales:
//   0–40 verde · 41–75 amarillo · 76–100 rojo
export type CasoInput = {
  ramo: string;
  ciudad: string;
  monto_reclamado: number;
  suma_asegurada: number;
  dias_reporte: number; // días entre ocurrencia y reporte
  antiguedad_poliza_dias: number; // días desde inicio de la póliza al siniestro
  reclamos_ult_12m: number;
  documentos_completos: boolean;
  proveedor_lista_restrictiva: boolean;
  proveedor_casos_anio: number;
  placa_reincidente: boolean; // ¿la placa aparece en otro siniestro reciente?
  beneficiario_distinto_titular: boolean;
  hora_madrugada: boolean; // ocurrencia 00:00–05:00
  tipo_impacto?: "ninguno" | "frontal" | "posterior" | "volcadura" | "multiple";
  relato_ilogico?: boolean; // relato del asegurado inconsistente con el tipo de impacto
};


export type ReglaResultado = {
  id: string;
  nombre: string;
  descripcion: string;
  activada: boolean;
  puntos: number; // puntos aportados al score si se activa
  detalle?: string;
};

type Regla = {
  id: string;
  nombre: string;
  descripcion: string;
  puntos: number; // puntos máximos teóricos (para mostrar en UI)
  evaluar: (c: CasoInput) => { activada: boolean; detalle?: string; puntos?: number };
};


export const REGLAS: Regla[] = [
  {
    id: "R01",
    nombre: "Reporte tardío",
    descripcion: "Más de 5 días entre ocurrencia y reporte",
    puntos: 15,
    evaluar: (c) => ({
      activada: c.dias_reporte > 5,
      detalle: `${c.dias_reporte} días desde la ocurrencia`,
    }),
  },
  {
    id: "R02",
    nombre: "Póliza recién emitida",
    descripcion: "Siniestro dentro de los primeros 30 días de la póliza",
    puntos: 18,
    evaluar: (c) => ({
      activada: c.antiguedad_poliza_dias <= 30,
      detalle: `Póliza con ${c.antiguedad_poliza_dias} días de antigüedad`,
    }),
  },
  {
    id: "R03",
    nombre: "Monto cercano a suma asegurada",
    descripcion: "Reclamo > 80% de la suma asegurada",
    puntos: 15,
    evaluar: (c) => {
      const ratio = c.suma_asegurada > 0 ? c.monto_reclamado / c.suma_asegurada : 0;
      return {
        activada: ratio > 0.8,
        detalle: `Ratio ${(ratio * 100).toFixed(0)}% sobre suma asegurada`,
      };
    },
  },
  {
    id: "R04",
    nombre: "Reincidencia del asegurado",
    descripcion: "Más de 2 reclamos en los últimos 12 meses",
    puntos: 12,
    evaluar: (c) => ({
      activada: c.reclamos_ult_12m > 2,
      detalle: `${c.reclamos_ult_12m} reclamos en 12 meses`,
    }),
  },
  {
    id: "R05",
    nombre: "Documentos incompletos",
    descripcion: "Faltan documentos clave en el expediente",
    puntos: 10,
    evaluar: (c) => ({ activada: !c.documentos_completos }),
  },
  {
    id: "R06",
    nombre: "Proveedor en lista restrictiva",
    descripcion: "Taller/proveedor flaggeado por compliance",
    puntos: 25,
    evaluar: (c) => ({ activada: c.proveedor_lista_restrictiva }),
  },
  {
    id: "R07",
    nombre: "Proveedor con alta siniestralidad",
    descripcion: "Más de 20 casos observados en el último año",
    puntos: 10,
    evaluar: (c) => ({
      activada: c.proveedor_casos_anio > 20,
      detalle: `${c.proveedor_casos_anio} casos en 12 meses`,
    }),
  },
  {
    id: "R08",
    nombre: "Placa reincidente",
    descripcion: "El mismo vehículo aparece en otro siniestro reciente",
    puntos: 20,
    evaluar: (c) => ({ activada: c.placa_reincidente }),
  },
  {
    id: "R09",
    nombre: "Beneficiario distinto al titular",
    descripcion: "El pago se solicita a un tercero",
    puntos: 8,
    evaluar: (c) => ({ activada: c.beneficiario_distinto_titular }),
  },
  {
    id: "R10",
    nombre: "Ocurrencia en horario atípico",
    descripcion: "Siniestro reportado entre 00:00 y 05:00",
    puntos: 7,
    evaluar: (c) => ({ activada: c.hora_madrugada }),
  },
  {
    id: "R11",
    nombre: "Dinámica sospechosa",
    descripcion: "Tipo de impacto que requiere revisión minuciosa (frontal/posterior/volcadura/múltiple), relato ilógico vs impacto, o accidente múltiple de madrugada",
    puntos: 15,
    evaluar: (c) => {
      let p = 0;
      const motivos: string[] = [];
      const tipo = c.tipo_impacto ?? "ninguno";
      if (tipo === "volcadura" || tipo === "multiple") {
        p += 6;
        motivos.push(`impacto ${tipo} (+6)`);
      } else if (tipo === "frontal" || tipo === "posterior") {
        p += 4;
        motivos.push(`impacto ${tipo} (+4)`);
      }
      if (c.relato_ilogico) {
        p += 6;
        motivos.push("relato ilógico vs impacto (+6)");
      }
      if (tipo === "multiple" && c.hora_madrugada) {
        p += 3;
        motivos.push("múltiple de madrugada (+3)");
      }
      return {
        activada: p > 0,
        puntos: p,
        detalle: motivos.join(" · "),
      };
    },
  },
];


export function evaluarCaso(c: CasoInput): ReglaResultado[] {
  return REGLAS.map((r) => {
    const { activada, detalle, puntos } = r.evaluar(c);
    return {
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      puntos: puntos ?? r.puntos,
      activada,
      detalle,
    };
  });
}


export function nivelDeScore(score: number): "verde" | "amarillo" | "rojo" {
  if (score >= 76) return "rojo";
  if (score >= 41) return "amarillo";
  return "verde";
}

export function explicar(reglas: ReglaResultado[], score: number): string {
  const activas = reglas.filter((r) => r.activada);
  const nivel = nivelDeScore(score);
  if (activas.length === 0) {
    return "No se detectaron patrones atípicos. Caso compatible con un siniestro legítimo. Score bajo, continuar con trámite estándar.";
  }
  const top = [...activas].sort((a, b) => b.puntos - a.puntos).slice(0, 3);
  const motivos = top.map((r) => `**${r.nombre}** (+${r.puntos})${r.detalle ? ` — ${r.detalle}` : ""}`).join("; ");
  const accion =
    nivel === "rojo"
      ? "Se recomienda **derivar a la unidad antifraude** y suspender pagos hasta verificación documental e inspección presencial."
      : nivel === "amarillo"
      ? "Se recomienda **revisión adicional** por parte del analista: contrastar documentos, validar proveedor y entrevistar al asegurado."
      : "Patrones leves: continuar el trámite con monitoreo, sin escalar.";
  return `Patrones detectados: ${motivos}. ${accion} (La decisión final corresponde al analista humano.)`;
}

// Presets para demo en vivo
export const PRESETS: Record<string, { label: string; descripcion: string; caso: CasoInput }> = {
  limpio: {
    label: "Caso limpio",
    descripcion: "Siniestro normal sin patrones de riesgo",
    caso: {
      ramo: "Vehículos", ciudad: "Quito",
      monto_reclamado: 3200, suma_asegurada: 25000,
      dias_reporte: 1, antiguedad_poliza_dias: 420,
      reclamos_ult_12m: 0, documentos_completos: true,
      proveedor_lista_restrictiva: false, proveedor_casos_anio: 4,
      placa_reincidente: false, beneficiario_distinto_titular: false,
      hora_madrugada: false,
    },
  },
  tardio: {
    label: "Reporte tardío",
    descripcion: "Cliente reporta 12 días después de la ocurrencia",
    caso: {
      ramo: "Vehículos", ciudad: "Guayaquil",
      monto_reclamado: 8500, suma_asegurada: 30000,
      dias_reporte: 12, antiguedad_poliza_dias: 600,
      reclamos_ult_12m: 1, documentos_completos: true,
      proveedor_lista_restrictiva: false, proveedor_casos_anio: 8,
      placa_reincidente: false, beneficiario_distinto_titular: false,
      hora_madrugada: false,
    },
  },
  proveedor: {
    label: "Proveedor restrictivo",
    descripcion: "Taller en lista restrictiva con alta siniestralidad",
    caso: {
      ramo: "Vehículos", ciudad: "Quito",
      monto_reclamado: 12000, suma_asegurada: 28000,
      dias_reporte: 3, antiguedad_poliza_dias: 200,
      reclamos_ult_12m: 1, documentos_completos: true,
      proveedor_lista_restrictiva: true, proveedor_casos_anio: 35,
      placa_reincidente: false, beneficiario_distinto_titular: false,
      hora_madrugada: false,
    },
  },
  reincidencia: {
    label: "Placa reincidente",
    descripcion: "Mismo vehículo aparece en otro siniestro reciente",
    caso: {
      ramo: "Vehículos", ciudad: "Cuenca",
      monto_reclamado: 9800, suma_asegurada: 22000,
      dias_reporte: 4, antiguedad_poliza_dias: 90,
      reclamos_ult_12m: 3, documentos_completos: false,
      proveedor_lista_restrictiva: false, proveedor_casos_anio: 15,
      placa_reincidente: true, beneficiario_distinto_titular: true,
      hora_madrugada: true,
    },
  },
  monto: {
    label: "Monto sospechoso",
    descripcion: "Reclamo cercano al 100% de la suma asegurada, póliza nueva",
    caso: {
      ramo: "Vehículos", ciudad: "Guayaquil",
      monto_reclamado: 23500, suma_asegurada: 25000,
      dias_reporte: 7, antiguedad_poliza_dias: 18,
      reclamos_ult_12m: 1, documentos_completos: false,
      proveedor_lista_restrictiva: false, proveedor_casos_anio: 12,
      placa_reincidente: false, beneficiario_distinto_titular: true,
      hora_madrugada: true,
    },
  },
};
