# Modelo de datos

| Tabla | Propósito |
|---|---|
| `asegurados` | Maestro de clientes |
| `polizas` | Pólizas vigentes |
| `proveedores` | Talleres / clínicas / peritos + lista restrictiva |
| `siniestros` | Reclamación + `score_riesgo` + `nivel_riesgo` + `reglas_activadas` |
| `documentos` | Documentos del expediente |
| `alertas_log` | Historial de alertas |
| `chat_history` | Conversaciones con el agente IA (RLS por usuario) |
| `config` | Parámetros editables (umbrales, pesos) |

RLS: `auth_all_*` para tablas operativas; `chat_history` aislada por `auth.uid()`.
