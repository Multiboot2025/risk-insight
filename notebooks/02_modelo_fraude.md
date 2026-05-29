# 02 — Modelo de fraude (motor de reglas)

Implementación en `src/lib/fraud-rules.ts`. Cada regla aporta puntos al score (0–100).

| Regla | Peso | Señal |
|---|---|---|
| R01 Reporte tardío | 15 | `dias_reporte > 5` |
| R02 Póliza recién emitida | 18 | `antiguedad_poliza_dias ≤ 30` |
| R03 Monto cercano a suma asegurada | 15 | ratio > 80% |
| R04 Reincidencia | 12 | `reclamos_ult_12m > 2` |
| R05 Documentos incompletos | 10 | flag |
| R06 Proveedor en lista restrictiva | 10 | flag |
| R07 Proveedor alta siniestralidad | 10 | `casos_anio > 20` |
| R08 Placa reincidente | 20 | match cruzado |
| R09 Beneficiario ≠ titular | 8 | flag |
| R10 Horario atípico | 3 | 00–05h |
| R11 Dinámica sospechosa | 15 | impacto + relato + madrugada |

Umbrales: 0–40 verde · 41–75 amarillo · 76–100 rojo.
