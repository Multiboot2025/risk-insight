# Reglas de negocio

Implementación: `src/lib/fraud-rules.ts`. Detalle de pesos: `notebooks/02_modelo_fraude.md`.

## Umbrales
| Nivel | Score |
|---|---|
| Bajo (verde) | 0–40 |
| Medio (amarillo) | 41–60 |
| Alto (rojo) | 61–80 |
| Crítico (rojo intenso) | 81–100 |

Las reglas son auditables: cada activación se guarda en `siniestros.reglas_activadas` (JSONB) con su peso y motivo.
