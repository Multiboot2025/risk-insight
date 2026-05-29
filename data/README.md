# data/

Espacio para datasets usados por el proyecto. **No versionar datos sensibles ni reales.**

- `raw/` — datos crudos tal cual fueron recibidos. Nunca commitear archivos reales.
- `processed/` — datasets ya limpios/transformados, listos para análisis o features.
- `synthetic/` — datos sintéticos generados para demo (los que alimentan la app actual).

Solo se versionan archivos `.gitkeep` y este README. Cualquier `.csv`, `.json` o `.parquet` con datos reales debe quedar fuera del repo.
