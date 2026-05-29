# 03 — Evaluación del modelo

Validación heurística contra los casos sintéticos etiquetados.

## Métricas sugeridas
- Precisión y recall sobre etiqueta `fraude_conocido` (cuando exista).
- Tasa de falsos positivos por ramo.
- Distribución de score por nivel real.
- Aporte marginal de cada regla (ablation simple).

## Próximos pasos
- Reemplazar reglas duras por un modelo supervisado (XGBoost / LightGBM) usando las reglas como features.
- Mantener explicabilidad con SHAP además del trazado de reglas.
