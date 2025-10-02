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
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          user_limit_adicionais: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          user_limit_adicionais?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          user_limit_adicionais?: number | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          company_id: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_access_log: {
        Row: {
          accessed_at: string
          action: string
          id: string
          ip_address: unknown | null
          lead_id: string
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          action: string
          id?: string
          ip_address?: unknown | null
          lead_id: string
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          action?: string
          id?: string
          ip_address?: unknown | null
          lead_id?: string
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_access_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_observations: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          note_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          note_type?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          note_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_observations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_observations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          company_id: string
          created_at: string
          email: string | null
          estimated_value: number | null
          id: string
          name: string
          phone: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          id?: string
          name: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          id?: string
          name?: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ownership_transfers: {
        Row: {
          company_id: string
          from_user_id: string
          id: string
          to_user_id: string
          transferred_at: string | null
          transferred_by: string
        }
        Insert: {
          company_id: string
          from_user_id: string
          id?: string
          to_user_id: string
          transferred_at?: string | null
          transferred_by: string
        }
        Update: {
          company_id?: string
          from_user_id?: string
          id?: string
          to_user_id?: string
          transferred_at?: string | null
          transferred_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          completed: boolean
          created_at: string
          description: string
          id: string
          lead_id: string
          reminder_date: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description: string
          id?: string
          lead_id: string
          reminder_date: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          reminder_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          status: string
          title: string
        }
        Insert: {
          assigned_to: string
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          status?: string
          title: string
        }
        Update: {
          assigned_to?: string
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_additional_users: {
        Args: { _company_id: string }
        Returns: number
      }
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_email_unique_in_company: {
        Args: { _company_id: string; _email: string }
        Returns: boolean
      }
      is_owner: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "gestor" | "vendedor" | "gestor_owner"
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
    Enums: {
      app_role: ["gestor", "vendedor", "gestor_owner"],
    },
  },
} as const
