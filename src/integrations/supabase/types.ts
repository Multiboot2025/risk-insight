export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alertas_log: {
        Row: {
          destinatario: string | null
          email_enviado: boolean | null
          fecha: string | null
          id: string
          id_siniestro: string | null
          nivel_riesgo: string | null
          payload: Json | null
          score: number | null
        }
        Insert: {
          destinatario?: string | null
          email_enviado?: boolean | null
          fecha?: string | null
          id?: string
          id_siniestro?: string | null
          nivel_riesgo?: string | null
          payload?: Json | null
          score?: number | null
        }
        Update: {
          destinatario?: string | null
          email_enviado?: boolean | null
          fecha?: string | null
          id?: string
          id_siniestro?: string | null
          nivel_riesgo?: string | null
          payload?: Json | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_log_id_siniestro_fkey"
            columns: ["id_siniestro"]
            isOneToOne: false
            referencedRelation: "siniestros"
            referencedColumns: ["id_siniestro"]
          },
        ]
      }
      asegurados: {
        Row: {
          antiguedad_meses: number | null
          ciudad: string | null
          created_at: string | null
          id_asegurado: string
          mora_actual: boolean | null
          nombre_anon: string
          num_polizas: number | null
          reclamos_ult_12m: number | null
          score_cliente: number | null
          segmento: string | null
        }
        Insert: {
          antiguedad_meses?: number | null
          ciudad?: string | null
          created_at?: string | null
          id_asegurado: string
          mora_actual?: boolean | null
          nombre_anon: string
          num_polizas?: number | null
          reclamos_ult_12m?: number | null
          score_cliente?: number | null
          segmento?: string | null
        }
        Update: {
          antiguedad_meses?: number | null
          ciudad?: string | null
          created_at?: string | null
          id_asegurado?: string
          mora_actual?: boolean | null
          nombre_anon?: string
          num_polizas?: number | null
          reclamos_ult_12m?: number | null
          score_cliente?: number | null
          segmento?: string | null
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          content: string | null
          contexto: Json | null
          created_at: string | null
          id: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          contexto?: Json | null
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          contexto?: Json | null
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      config: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      documentos: {
        Row: {
          created_at: string | null
          entregado: boolean | null
          fecha_emision: string | null
          id_documento: string
          id_siniestro: string | null
          inconsistencia_detectada: boolean | null
          legible: boolean | null
          observacion: string | null
          tipo_documento: string | null
        }
        Insert: {
          created_at?: string | null
          entregado?: boolean | null
          fecha_emision?: string | null
          id_documento?: string
          id_siniestro?: string | null
          inconsistencia_detectada?: boolean | null
          legible?: boolean | null
          observacion?: string | null
          tipo_documento?: string | null
        }
        Update: {
          created_at?: string | null
          entregado?: boolean | null
          fecha_emision?: string | null
          id_documento?: string
          id_siniestro?: string | null
          inconsistencia_detectada?: boolean | null
          legible?: boolean | null
          observacion?: string | null
          tipo_documento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_id_siniestro_fkey"
            columns: ["id_siniestro"]
            isOneToOne: false
            referencedRelation: "siniestros"
            referencedColumns: ["id_siniestro"]
          },
        ]
      }
      polizas: {
        Row: {
          canal_venta: string | null
          ciudad: string | null
          created_at: string | null
          deducible: number | null
          estado_poliza: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id_asegurado: string | null
          id_poliza: string
          prima: number | null
          ramo: string | null
          suma_asegurada: number | null
        }
        Insert: {
          canal_venta?: string | null
          ciudad?: string | null
          created_at?: string | null
          deducible?: number | null
          estado_poliza?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id_asegurado?: string | null
          id_poliza: string
          prima?: number | null
          ramo?: string | null
          suma_asegurada?: number | null
        }
        Update: {
          canal_venta?: string | null
          ciudad?: string | null
          created_at?: string | null
          deducible?: number | null
          estado_poliza?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id_asegurado?: string | null
          id_poliza?: string
          prima?: number | null
          ramo?: string | null
          suma_asegurada?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "polizas_id_asegurado_fkey"
            columns: ["id_asegurado"]
            isOneToOne: false
            referencedRelation: "asegurados"
            referencedColumns: ["id_asegurado"]
          },
        ]
      }
      proveedores: {
        Row: {
          antiguedad_meses: number | null
          casos_observados_anio: number | null
          ciudad: string | null
          created_at: string | null
          en_lista_restrictiva: boolean | null
          id_proveedor: string
          nombre: string
          tipo: string | null
        }
        Insert: {
          antiguedad_meses?: number | null
          casos_observados_anio?: number | null
          ciudad?: string | null
          created_at?: string | null
          en_lista_restrictiva?: boolean | null
          id_proveedor: string
          nombre: string
          tipo?: string | null
        }
        Update: {
          antiguedad_meses?: number | null
          casos_observados_anio?: number | null
          ciudad?: string | null
          created_at?: string | null
          en_lista_restrictiva?: boolean | null
          id_proveedor?: string
          nombre?: string
          tipo?: string | null
        }
        Relationships: []
      }
      siniestros: {
        Row: {
          beneficiario: string | null
          ciudad: string | null
          cobertura: string | null
          created_at: string | null
          descripcion: string | null
          dinamica_accidente: string | null
          documentos_completos: boolean | null
          estado: string | null
          explicacion_ia: string | null
          fecha_ocurrencia: string | null
          fecha_reporte: string | null
          hubo_tercero: boolean | null
          id_asegurado: string | null
          id_poliza: string | null
          id_proveedor: string | null
          id_siniestro: string
          monto_estimado: number | null
          monto_pagado: number | null
          monto_reclamado: number | null
          nivel_riesgo: string | null
          ramo: string | null
          reglas_activadas: Json | null
          score_riesgo: number | null
          similitud_pct: number | null
          siniestro_similar_id: string | null
          sucursal: string | null
          updated_at: string | null
          vehiculo_anio: number | null
          vehiculo_chasis: string | null
          vehiculo_marca: string | null
          vehiculo_modelo: string | null
          vehiculo_motor: string | null
          vehiculo_placa: string | null
        }
        Insert: {
          beneficiario?: string | null
          ciudad?: string | null
          cobertura?: string | null
          created_at?: string | null
          descripcion?: string | null
          dinamica_accidente?: string | null
          documentos_completos?: boolean | null
          estado?: string | null
          explicacion_ia?: string | null
          fecha_ocurrencia?: string | null
          fecha_reporte?: string | null
          hubo_tercero?: boolean | null
          id_asegurado?: string | null
          id_poliza?: string | null
          id_proveedor?: string | null
          id_siniestro?: string
          monto_estimado?: number | null
          monto_pagado?: number | null
          monto_reclamado?: number | null
          nivel_riesgo?: string | null
          ramo?: string | null
          reglas_activadas?: Json | null
          score_riesgo?: number | null
          similitud_pct?: number | null
          siniestro_similar_id?: string | null
          sucursal?: string | null
          updated_at?: string | null
          vehiculo_anio?: number | null
          vehiculo_chasis?: string | null
          vehiculo_marca?: string | null
          vehiculo_modelo?: string | null
          vehiculo_motor?: string | null
          vehiculo_placa?: string | null
        }
        Update: {
          beneficiario?: string | null
          ciudad?: string | null
          cobertura?: string | null
          created_at?: string | null
          descripcion?: string | null
          dinamica_accidente?: string | null
          documentos_completos?: boolean | null
          estado?: string | null
          explicacion_ia?: string | null
          fecha_ocurrencia?: string | null
          fecha_reporte?: string | null
          hubo_tercero?: boolean | null
          id_asegurado?: string | null
          id_poliza?: string | null
          id_proveedor?: string | null
          id_siniestro?: string
          monto_estimado?: number | null
          monto_pagado?: number | null
          monto_reclamado?: number | null
          nivel_riesgo?: string | null
          ramo?: string | null
          reglas_activadas?: Json | null
          score_riesgo?: number | null
          similitud_pct?: number | null
          siniestro_similar_id?: string | null
          sucursal?: string | null
          updated_at?: string | null
          vehiculo_anio?: number | null
          vehiculo_chasis?: string | null
          vehiculo_marca?: string | null
          vehiculo_modelo?: string | null
          vehiculo_motor?: string | null
          vehiculo_placa?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "siniestros_id_asegurado_fkey"
            columns: ["id_asegurado"]
            isOneToOne: false
            referencedRelation: "asegurados"
            referencedColumns: ["id_asegurado"]
          },
          {
            foreignKeyName: "siniestros_id_poliza_fkey"
            columns: ["id_poliza"]
            isOneToOne: false
            referencedRelation: "polizas"
            referencedColumns: ["id_poliza"]
          },
          {
            foreignKeyName: "siniestros_id_proveedor_fkey"
            columns: ["id_proveedor"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id_proveedor"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
