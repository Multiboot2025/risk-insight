
-- ============ TABLAS PRINCIPALES ============

CREATE TABLE public.asegurados (
  id_asegurado TEXT PRIMARY KEY,
  nombre_anon TEXT NOT NULL,
  segmento TEXT,
  antiguedad_meses INT DEFAULT 0,
  ciudad TEXT,
  num_polizas INT DEFAULT 0,
  reclamos_ult_12m INT DEFAULT 0,
  mora_actual BOOLEAN DEFAULT false,
  score_cliente INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.proveedores (
  id_proveedor TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT,
  ciudad TEXT,
  en_lista_restrictiva BOOLEAN DEFAULT false,
  casos_observados_anio INT DEFAULT 0,
  antiguedad_meses INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.polizas (
  id_poliza TEXT PRIMARY KEY,
  id_asegurado TEXT REFERENCES public.asegurados(id_asegurado) ON DELETE CASCADE,
  ramo TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  prima NUMERIC,
  suma_asegurada NUMERIC,
  deducible NUMERIC,
  canal_venta TEXT,
  ciudad TEXT,
  estado_poliza TEXT DEFAULT 'vigente',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.siniestros (
  id_siniestro UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_poliza TEXT REFERENCES public.polizas(id_poliza),
  id_asegurado TEXT REFERENCES public.asegurados(id_asegurado),
  id_proveedor TEXT REFERENCES public.proveedores(id_proveedor),
  ramo TEXT,
  cobertura TEXT,
  fecha_ocurrencia DATE,
  fecha_reporte DATE,
  monto_reclamado NUMERIC,
  monto_estimado NUMERIC,
  monto_pagado NUMERIC,
  estado TEXT DEFAULT 'reserva',
  sucursal TEXT,
  ciudad TEXT,
  descripcion TEXT,
  documentos_completos BOOLEAN DEFAULT true,
  beneficiario TEXT,
  vehiculo_placa TEXT,
  vehiculo_chasis TEXT,
  vehiculo_motor TEXT,
  vehiculo_marca TEXT,
  vehiculo_modelo TEXT,
  vehiculo_anio INT,
  dinamica_accidente TEXT,
  hubo_tercero BOOLEAN,
  score_riesgo INT DEFAULT 0,
  nivel_riesgo TEXT DEFAULT 'verde',
  reglas_activadas JSONB DEFAULT '[]'::jsonb,
  explicacion_ia TEXT,
  siniestro_similar_id UUID,
  similitud_pct NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_siniestros_nivel ON public.siniestros(nivel_riesgo);
CREATE INDEX idx_siniestros_score ON public.siniestros(score_riesgo DESC);
CREATE INDEX idx_siniestros_asegurado ON public.siniestros(id_asegurado);
CREATE INDEX idx_siniestros_proveedor ON public.siniestros(id_proveedor);

CREATE TABLE public.documentos (
  id_documento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_siniestro UUID REFERENCES public.siniestros(id_siniestro) ON DELETE CASCADE,
  tipo_documento TEXT,
  entregado BOOLEAN DEFAULT false,
  legible BOOLEAN DEFAULT true,
  fecha_emision DATE,
  inconsistencia_detectada BOOLEAN DEFAULT false,
  observacion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.alertas_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_siniestro UUID REFERENCES public.siniestros(id_siniestro) ON DELETE CASCADE,
  nivel_riesgo TEXT,
  score INT,
  fecha TIMESTAMPTZ DEFAULT now(),
  email_enviado BOOLEAN DEFAULT false,
  destinatario TEXT,
  payload JSONB
);

CREATE TABLE public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  role TEXT,
  content TEXT,
  contexto JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_user_date ON public.chat_history(user_id, created_at DESC);

CREATE TABLE public.config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ GRANTS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asegurados TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proveedores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polizas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.siniestros TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alertas_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.config TO authenticated;

GRANT ALL ON public.asegurados TO service_role;
GRANT ALL ON public.proveedores TO service_role;
GRANT ALL ON public.polizas TO service_role;
GRANT ALL ON public.siniestros TO service_role;
GRANT ALL ON public.documentos TO service_role;
GRANT ALL ON public.alertas_log TO service_role;
GRANT ALL ON public.chat_history TO service_role;
GRANT ALL ON public.config TO service_role;

-- ============ RLS ============
ALTER TABLE public.asegurados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polizas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siniestros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

-- Política unificada: cualquier usuario autenticado puede CRUD (app interna de analistas)
CREATE POLICY "auth_all_asegurados" ON public.asegurados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_proveedores" ON public.proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_polizas" ON public.polizas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_siniestros" ON public.siniestros FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_documentos" ON public.documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_alertas" ON public.alertas_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_config" ON public.config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- chat_history scoped por usuario
CREATE POLICY "user_own_chat" ON public.chat_history FOR ALL TO authenticated 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TRIGGER updated_at ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER siniestros_updated_at BEFORE UPDATE ON public.siniestros
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER config_updated_at BEFORE UPDATE ON public.config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CONFIG INICIAL ============
INSERT INTO public.config (key, value) VALUES
  ('email_alertas', '{"destinatario":"antifraude@fraudia.demo","enviar_en":["amarillo","rojo"]}'::jsonb),
  ('umbrales', '{"verde_max":40,"amarillo_max":75}'::jsonb);
