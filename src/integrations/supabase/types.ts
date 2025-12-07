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
      admin_otp_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          used?: boolean | null
        }
        Relationships: []
      }
      ai_report_insights: {
        Row: {
          attention_points: Json | null
          company_id: string
          created_at: string | null
          highlights: Json | null
          id: string
          motivation: string | null
          report_date: string
          report_type: string
          strategic_analysis: string | null
          suggested_actions: Json | null
          summary: string | null
          user_id: string | null
        }
        Insert: {
          attention_points?: Json | null
          company_id: string
          created_at?: string | null
          highlights?: Json | null
          id?: string
          motivation?: string | null
          report_date: string
          report_type: string
          strategic_analysis?: string | null
          suggested_actions?: Json | null
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          attention_points?: Json | null
          company_id?: string
          created_at?: string | null
          highlights?: Json | null
          id?: string
          motivation?: string | null
          report_date?: string
          report_type?: string
          strategic_analysis?: string | null
          suggested_actions?: Json | null
          summary?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_report_insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_report_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_tokens: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          id: string
          last_used_at: string | null
          name: string
          token: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          name: string
          token: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          name?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          system_name: string | null
          theme: string
          user_limit_adicionais: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          system_name?: string | null
          theme?: string
          user_limit_adicionais?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          system_name?: string | null
          theme?: string
          user_limit_adicionais?: number | null
        }
        Relationships: []
      }
      gamification_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          lead_id: string | null
          metadata: Json | null
          points: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          points: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gamification_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_settings: {
        Row: {
          company_id: string
          event_type: string
          id: string
          points: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          company_id: string
          event_type: string
          id?: string
          points: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          event_type?: string
          id?: string
          points?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gamification_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          api_token_id: string | null
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          lead_id: string | null
          payload: Json | null
          source: string
          status: string
        }
        Insert: {
          api_token_id?: string | null
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          payload?: Json | null
          source?: string
          status: string
        }
        Update: {
          api_token_id?: string | null
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          payload?: Json | null
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_api_token_id_fkey"
            columns: ["api_token_id"]
            isOneToOne: false
            referencedRelation: "api_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
          ip_address: unknown
          lead_id: string
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          action: string
          id?: string
          ip_address?: unknown
          lead_id: string
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          action?: string
          id?: string
          ip_address?: unknown
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
          return_scheduled_date: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          note_type?: string
          return_scheduled_date?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          note_type?: string
          return_scheduled_date?: string | null
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
      lead_values: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string
          name: string
          notes: string | null
          updated_at: string | null
          value_type: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id: string
          name: string
          notes?: string | null
          updated_at?: string | null
          value_type: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_values_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
          motivo_perda: string | null
          name: string
          phone: string | null
          qualificado: boolean | null
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
          motivo_perda?: string | null
          name: string
          phone?: string | null
          qualificado?: boolean | null
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
          motivo_perda?: string | null
          name?: string
          phone?: string | null
          qualificado?: boolean | null
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
      marketing_costs: {
        Row: {
          average_retention_months: number | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          marketing_cost: number | null
          period_end: string
          period_start: string
          sales_cost: number | null
          updated_at: string
        }
        Insert: {
          average_retention_months?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          marketing_cost?: number | null
          period_end: string
          period_start: string
          sales_cost?: number | null
          updated_at?: string
        }
        Update: {
          average_retention_months?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          marketing_cost?: number | null
          period_end?: string
          period_start?: string
          sales_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_costs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_notifications: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          notification_type: string
          read: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          notification_type: string
          read?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          notification_type?: string
          read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notifications_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          created_at: string
          id: string
          is_organizer: boolean
          meeting_id: string
          reminder_sent: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_organizer?: boolean
          meeting_id: string
          reminder_sent?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_organizer?: boolean
          meeting_id?: string
          reminder_sent?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          feedback: string | null
          feedback_collected: boolean
          id: string
          lead_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          feedback?: string | null
          feedback_collected?: boolean
          id?: string
          lead_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          feedback?: string | null
          feedback_collected?: boolean
          id?: string
          lead_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          company_id: string
          created_at: string
          email_notifications: boolean | null
          id: string
          is_super_admin: boolean | null
          must_change_password: boolean | null
          name: string
          onboarding_completed: boolean | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          company_id: string
          created_at?: string
          email_notifications?: boolean | null
          id: string
          is_super_admin?: boolean | null
          must_change_password?: boolean | null
          name: string
          onboarding_completed?: boolean | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          is_super_admin?: boolean | null
          must_change_password?: boolean | null
          name?: string
          onboarding_completed?: boolean | null
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
      rate_limit_log: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          completed: boolean
          created_at: string
          description: string
          id: string
          lead_id: string | null
          reminder_date: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description: string
          id?: string
          lead_id?: string | null
          reminder_date: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string
          id?: string
          lead_id?: string | null
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
      report_settings: {
        Row: {
          ai_analysis_level: string | null
          company_id: string
          daily_report_time: string | null
          daily_reports_enabled: boolean | null
          extra_recipients: string[] | null
          id: string
          include_predictions: boolean | null
          include_swot: boolean | null
          updated_at: string | null
          updated_by: string | null
          weekly_report_day: number | null
          weekly_report_time: string | null
          weekly_reports_enabled: boolean | null
        }
        Insert: {
          ai_analysis_level?: string | null
          company_id: string
          daily_report_time?: string | null
          daily_reports_enabled?: boolean | null
          extra_recipients?: string[] | null
          id?: string
          include_predictions?: boolean | null
          include_swot?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          weekly_report_day?: number | null
          weekly_report_time?: string | null
          weekly_reports_enabled?: boolean | null
        }
        Update: {
          ai_analysis_level?: string | null
          company_id?: string
          daily_report_time?: string | null
          daily_reports_enabled?: boolean | null
          extra_recipients?: string[] | null
          id?: string
          include_predictions?: boolean | null
          include_swot?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          weekly_report_day?: number | null
          weekly_report_time?: string | null
          weekly_reports_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "report_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_goals: {
        Row: {
          company_id: string
          conversions_goal: number | null
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          leads_goal: number | null
          observations_goal: number | null
          period_type: string
          revenue_goal: number | null
          start_date: string
          tasks_goal: number | null
          user_id: string
        }
        Insert: {
          company_id: string
          conversions_goal?: number | null
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          leads_goal?: number | null
          observations_goal?: number | null
          period_type: string
          revenue_goal?: number | null
          start_date: string
          tasks_goal?: number | null
          user_id: string
        }
        Update: {
          company_id?: string
          conversions_goal?: number | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          leads_goal?: number | null
          observations_goal?: number | null
          period_type?: string
          revenue_goal?: number | null
          start_date?: string
          tasks_goal?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          company_id: string
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_limit: number
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          company_id: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_limit?: number
        }
        Update: {
          cancel_at_period_end?: boolean | null
          company_id?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          id: string
          status: string
          task_id: string
          user_id: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          task_id: string
          user_id: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_user_id_fkey"
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
          assignment_type: string
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          status: string
          title: string
          total_assigned: number | null
          total_completed: number | null
          updated_at: string
        }
        Insert: {
          assigned_to: string
          assignment_type?: string
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          status?: string
          title: string
          total_assigned?: number | null
          total_completed?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          assignment_type?: string
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          status?: string
          title?: string
          total_assigned?: number | null
          total_completed?: number | null
          updated_at?: string
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
      whatsapp_campaign_messages: {
        Row: {
          campaign_id: string
          error_message: string | null
          id: string
          lead_id: string
          scheduled_at: string
          sent_at: string | null
          status: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          campaign_id: string
          error_message?: string | null
          id?: string
          lead_id: string
          scheduled_at: string
          sent_at?: string | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          campaign_id?: string
          error_message?: string | null
          id?: string
          lead_id?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaign_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaign_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaign_messages_whatsapp_message_id_fkey"
            columns: ["whatsapp_message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_campaigns: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          delay_seconds: number | null
          finished_at: string | null
          id: string
          leads_processed: number | null
          leads_responded: number | null
          leads_total: number
          message_template: string
          name: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          delay_seconds?: number | null
          finished_at?: string | null
          id?: string
          leads_processed?: number | null
          leads_responded?: number | null
          leads_total: number
          message_template: string
          name: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          delay_seconds?: number | null
          finished_at?: string | null
          id?: string
          leads_processed?: number | null
          leads_responded?: number | null
          leads_total?: number
          message_template?: string
          name?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          direction: string
          evolution_message_id: string | null
          id: string
          lead_id: string | null
          media_type: string | null
          media_url: string | null
          message: string
          phone: string
          status: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          direction: string
          evolution_message_id?: string | null
          id?: string
          lead_id?: string | null
          media_type?: string | null
          media_url?: string | null
          message: string
          phone: string
          status?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          direction?: string
          evolution_message_id?: string | null
          id?: string
          lead_id?: string | null
          media_type?: string | null
          media_url?: string | null
          message?: string
          phone?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_meeting: {
        Args: { _meeting_id: string; _user_id: string }
        Returns: boolean
      }
      cleanup_expired_otp_codes: { Args: never; Returns: undefined }
      cleanup_expired_reset_tokens: { Args: never; Returns: undefined }
      cleanup_old_integration_logs: { Args: never; Returns: undefined }
      cleanup_rate_limit_logs: { Args: never; Returns: undefined }
      count_additional_users: { Args: { _company_id: string }; Returns: number }
      create_api_token: { Args: { p_name: string }; Returns: string }
      generate_api_token: { Args: never; Returns: string }
      get_campaign_stats: {
        Args: { _campaign_id: string }
        Returns: {
          delivered: number
          failed: number
          pending: number
          read: number
          sent: number
          total: number
        }[]
      }
      get_gamification_points: {
        Args: { _company_id: string; _event_type: string }
        Returns: number
      }
      get_leads_with_future_activities: {
        Args: { p_company_id: string; p_end_date: string; p_start_date: string }
        Returns: {
          assigned_to: string
          company: string
          company_id: string
          created_at: string
          email: string
          estimated_value: number
          future_activities_count: number
          has_future_activity: boolean
          id: string
          name: string
          phone: string
          profile_name: string
          source: string
          status: string
          updated_at: string
        }[]
      }
      get_user_company_id: { Args: never; Returns: string }
      get_user_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role:
        | {
            Args: { _user_id: string }
            Returns: Database["public"]["Enums"]["app_role"]
          }
        | { Args: never; Returns: Database["public"]["Enums"]["app_role"] }
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
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      user_participates_in_meeting: {
        Args: { _meeting_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "gestor" | "vendedor" | "gestor_owner"
      meeting_status: "agendada" | "realizada" | "cancelada"
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
      meeting_status: ["agendada", "realizada", "cancelada"],
    },
  },
} as const
