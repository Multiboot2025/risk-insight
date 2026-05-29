# Arquitectura

Ver también el `README.md` raíz (§2 y §10).

```
Datos sintéticos  →  Motor de reglas  →  Postgres (score + nivel_riesgo)
                                              ↓
                       Agente IA (6 tools)  ←  ┤
                                              ↓
                                       UI Analista
```

- **Frontend**: React 19 + TanStack Start v1 + Vite 7, rutas en `src/routes/`.
- **Backend**: Lovable Cloud (Supabase Postgres + Auth + RLS).
- **Server**: TanStack server routes en `src/routes/api/*`.
- **IA**: Lovable AI Gateway · `google/gemini-2.5-flash`.
