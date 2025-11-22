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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      follow_ups: {
        Row: {
          contacted_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          outcome: string | null
          patient_id: string
          patient_medication_id: string
          pharmacist_id: string
          scheduled_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contacted_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          patient_id: string
          patient_medication_id: string
          pharmacist_id: string
          scheduled_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contacted_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          patient_id?: string
          patient_medication_id?: string
          pharmacist_id?: string
          scheduled_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_patient_medication_id_fkey"
            columns: ["patient_medication_id"]
            isOneToOne: false
            referencedRelation: "patient_medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_pharmacist_id_fkey"
            columns: ["pharmacist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          category: string | null
          created_at: string | null
          dosage_frequency_hours: number | null
          follow_up_day: number
          id: string
          is_chronic: boolean | null
          name: string
          notes: string | null
          refill_reminder_days: number | null
          reminder_frequency: string
          standard_dosage: string | null
          treatment_duration_days: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          dosage_frequency_hours?: number | null
          follow_up_day: number
          id?: string
          is_chronic?: boolean | null
          name: string
          notes?: string | null
          refill_reminder_days?: number | null
          reminder_frequency: string
          standard_dosage?: string | null
          treatment_duration_days: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          dosage_frequency_hours?: number | null
          follow_up_day?: number
          id?: string
          is_chronic?: boolean | null
          name?: string
          notes?: string | null
          refill_reminder_days?: number | null
          reminder_frequency?: string
          standard_dosage?: string | null
          treatment_duration_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      patient_medications: {
        Row: {
          created_at: string | null
          custom_dosage: string | null
          end_date: string | null
          id: string
          medication_id: string
          patient_id: string
          prescribed_by: string
          quantity: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_dosage?: string | null
          end_date?: string | null
          id?: string
          medication_id: string
          patient_id: string
          prescribed_by: string
          quantity: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_dosage?: string | null
          end_date?: string | null
          id?: string
          medication_id?: string
          patient_id?: string
          prescribed_by?: string
          quantity?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medications_prescribed_by_fkey"
            columns: ["prescribed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          consent_given: boolean | null
          created_at: string | null
          full_name: string
          id: string
          pharmacist_id: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          consent_given?: boolean | null
          created_at?: string | null
          full_name: string
          id?: string
          pharmacist_id: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          consent_given?: boolean | null
          created_at?: string | null
          full_name?: string
          id?: string
          pharmacist_id?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_pharmacist_id_fkey"
            columns: ["pharmacist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          pharmacy_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          pharmacy_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          pharmacy_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string | null
          delivery_channel: string
          error_message: string | null
          id: string
          message: string
          patient_id: string
          patient_medication_id: string
          reminder_type: string
          scheduled_at: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_channel: string
          error_message?: string | null
          id?: string
          message: string
          patient_id: string
          patient_medication_id: string
          reminder_type: string
          scheduled_at: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_channel?: string
          error_message?: string | null
          id?: string
          message?: string
          patient_id?: string
          patient_medication_id?: string
          reminder_type?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_patient_medication_id_fkey"
            columns: ["patient_medication_id"]
            isOneToOne: false
            referencedRelation: "patient_medications"
            referencedColumns: ["id"]
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
