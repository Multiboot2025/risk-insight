# FraudIA Claims · Aseguradora del Sur

Sistema analítico de apoyo a la detección temprana de fraude en siniestros, construido sobre Lovable Cloud + TanStack Start. Las alertas y scores son **apoyo analítico**; la decisión final corresponde siempre al analista humano.

---

## 1. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TanStack Start v1 + Vite 7 |
| UI | Tailwind v4 + shadcn/ui + AI Elements |
| Backend | Lovable Cloud (Supabase: Postgres + Auth + RLS) |
| Server | TanStack server routes (`src/routes/api/*`) |
| IA | Lovable AI Gateway · `google/gemini-2.5-flash` vía AI SDK |
| Auth | Email + password (Supabase Auth) |

---

## 2. Arquitectura

```
Datos sintéticos  →  Motor de reglas  →  Postgres (score + nivel_riesgo)
                                              ↓
                       Agente IA (6 tools)  ←  ┤
                                              ↓
                                       UI Analista
                       Dashboard · Bandeja · Detalle · Chat FAB
```

Ver diagrama completo en `/docs` dentro de la app.

---

## 3. Modelo de datos

| Tabla | Propósito |
|---|---|
| `asegurados` | Maestro de clientes (segmento, antigüedad, score_cliente) |
| `polizas` | Pólizas vigentes por ramo, prima, suma asegurada |
| `proveedores` | Talleres / clínicas / peritos + lista restrictiva |
| `siniestros` | **Tabla central**: reclamación + `score_riesgo` (0–100) + `nivel_riesgo` + `reglas_activadas` (JSONB) + `explicacion_ia` |
| `documentos` | Documentos del expediente y flags de inconsistencia |
| `alertas_log` | Historial de alertas amarillas/rojas emitidas |
| `chat_history` | Conversaciones del analista con el agente IA (RLS por usuario) |
| `config` | Parámetros editables (umbrales, pesos de reglas) |

Todas las tablas (excepto `chat_history`) son visibles para cualquier usuario autenticado mediante RLS `auth_all_*`. `chat_history` está aislada por `auth.uid()`.

---

## 4. Motor de reglas y scoring

El score (0–100) se compone por suma ponderada de reglas evaluadas sobre cada siniestro. Cada regla activada se persiste en `reglas_activadas` (JSONB) con su peso y descripción, lo que hace la alerta **explicable**.

**Familias de reglas implementadas:**

| Regla | Señal | Peso típico |
|---|---|---|
| Documentación incompleta | `documentos_completos = false` o `documentos.inconsistencia_detectada` | +15 |
| Proveedor en lista restrictiva | `proveedores.en_lista_restrictiva = true` | +25 |
| Proveedor con alta concentración | `casos_observados_anio` por encima del p90 | +10 |
| Reincidencia del asegurado | `reclamos_ult_12m ≥ 3` | +15 |
| Mora actual del asegurado | `asegurados.mora_actual = true` | +10 |
| Reporte tardío | `fecha_reporte − fecha_ocurrencia > 7 días` | +10 |
| Similitud con otro siniestro | match por `vehiculo_placa` / `chasis` / `beneficiario` | +20 |
| Monto atípico vs. suma asegurada | `monto_reclamado / suma_asegurada > 0.8` | +15 |

**Umbrales (configurables en tabla `config`):**

| Nivel | Score | Color |
|---|---|---|
| Verde | 0 – 40 | bajo riesgo |
| Amarillo | 41 – 75 | revisar |
| Rojo | 76 – 100 | priorizar análisis |

---

## 5. Agente IA (consultas en lenguaje natural)

`src/routes/api/chat.ts` expone un server route que valida el bearer token del usuario, invoca Gemini 2.5 Flash vía Lovable AI Gateway, y persiste la conversación en `chat_history`. Disponible en:

- Ruta dedicada: `/chat`
- **FAB flotante** en toda la app autenticada (`src/components/chat-fab.tsx`)

**Tools expuestas al modelo:**

| Tool | Función |
|---|---|
| `listar_siniestros` | Filtra por nivel de riesgo, ramo, ciudad |
| `detalle_siniestro` | Trae expediente completo por UUID |
| `ranking_proveedores` | Top proveedores por casos observados |
| `stats_dashboard` | KPIs globales |
| `buscar_similares` | Match por placa / chasis / beneficiario |
| `alertas_recientes` | Últimas alertas emitidas |

El modelo nunca inventa datos: si necesita información, llama a una tool.

---

## 6. Interfaz del analista

| Ruta | Descripción |
|---|---|
| `/dashboard` | KPIs: totales, distribución por riesgo, monto en riesgo, top 5 casos rojos |
| `/casos` | Bandeja filtrable por riesgo / ramo / búsqueda |
| `/casos/$id` | Detalle del siniestro: datos, reglas activadas, explicación IA, similares |
| `/chat` | Conversación completa con el agente |
| `/proveedores` | Listado y lista restrictiva |
| `/reportes` | Reportes operativos |
| `/config` | Parámetros del motor de reglas |
| `/docs` | Documentación in-app (arquitectura, reglas, limitaciones) |

---

## 7. Limitaciones

- **Datos sintéticos**: los registros son de demostración, no representan operaciones reales.
- **Apoyo, no decisión**: el score no determina fraude; sólo prioriza casos para revisión humana.
- **Reglas heurísticas**: no se usa modelo ML supervisado en esta versión. La arquitectura permite enchufar uno más adelante (ver §9).
- **Sin OCR**: las inconsistencias documentales vienen de un flag previo, no de análisis automático de imágenes.
- **Idioma**: el agente IA responde en español; las queries en otros idiomas pueden degradar la calidad.
- **Sin reentrenamiento automático**: los pesos de reglas son fijos; ajustarlos requiere editar `config`.

---

## 8. Cómo ejecutar

El proyecto corre en Lovable; el preview se publica automáticamente. Para desarrollo local:

```bash
bun install
bun run dev
```

Variables necesarias (auto-provistas por Lovable Cloud):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 9. Arquitectura escalable (roadmap)

```
[Fuentes reales]              [Procesamiento]            [Consumo]
core asegurador  ─────►  ingest workers  ─────►  feature store
siniestros API           (Cloud Functions)              │
documentos (OCR) ─────►  Queue (pub/sub)  ─────►  Modelo ML supervisado
emails / call-center                                   │
                                                       ▼
                                              score + explicabilidad
                                                       │
                                                       ▼
                                              UI analista · API externa
```

Pasos sugeridos para producción:
1. Reemplazar datos sintéticos por ingestas reales del core asegurador (CDC / batch nocturno).
2. Añadir **modelo supervisado** (XGBoost / LightGBM) alimentado por las reglas como features + histórico etiquetado por el área de fraude.
3. Mantener la **explicabilidad** mediante SHAP values además de las reglas duras.
4. Mover el motor de reglas a un **worker dedicado** (cola + idempotencia) para escalar a millones de siniestros/mes.
5. Cifrado adicional para PII y enmascaramiento en queries del agente IA.
6. **Auditoría** completa: cada decisión del analista (aceptar/rechazar alerta) se loguea para feedback supervisado.

---

## 10. Estructura del repo

```
src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx · login.tsx
│   ├── _authenticated.tsx              # layout protegido + ChatFab
│   └── _authenticated/
│       ├── dashboard.tsx
│       ├── casos.index.tsx · casos.$id.tsx
│       ├── chat.tsx · proveedores.tsx
│       ├── reportes.tsx · config.tsx · docs.tsx
│   └── api/chat.ts                     # server route del agente IA
├── components/
│   ├── chat-panel.tsx · chat-fab.tsx   # agente IA reutilizable
│   ├── risk-badge.tsx · app-sidebar.tsx
│   ├── ai-elements/                    # primitivas del SDK de chat
│   └── ui/                             # shadcn/ui
├── integrations/supabase/              # clientes auto-generados
└── lib/                                # auth-context, utils
```
