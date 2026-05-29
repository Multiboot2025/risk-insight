# Uso de IA

Agente conversacional para el analista. Server route: `src/routes/api/chat.ts`.

- Modelo: `google/gemini-2.5-flash` vía Lovable AI Gateway (sin API key adicional).
- Conversación persistida en `chat_history` con RLS por usuario.
- Tools expuestas: `listar_siniestros`, `detalle_siniestro`, `ranking_proveedores`, `stats_dashboard`, `buscar_similares`, `alertas_recientes`.
- El modelo nunca inventa datos: si necesita información, llama a una tool.
- Disponible en `/chat` y como FAB flotante en toda la app autenticada.
