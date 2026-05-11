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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      branches: {
        Row: {
          contact: string | null
          created_at: string | null
          id: string
          image_url: string | null
          location: string | null
          name: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          contact?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          contact?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      contact_settings: {
        Row: {
          created_at: string | null
          gym_id: string | null
          id: string
          instagram_url: string | null
          updated_at: string | null
          user_id: string
          whatsapp_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string | null
          gym_id?: string | null
          id?: string
          instagram_url?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string | null
          gym_id?: string | null
          id?: string
          instagram_url?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          expense_date: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string | null
          expense_date: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          expense_date?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      gallery: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      gym_settings: {
        Row: {
          created_at: string | null
          gym_name: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          gym_name?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          gym_name?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gyms: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          fitness_goal: string | null
          id: string
          name: string
          phone: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fitness_goal?: string | null
          id?: string
          name: string
          phone: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fitness_goal?: string | null
          id?: string
          name?: string
          phone?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          created_at: string | null
          expiry_date: string
          id: string
          name: string
          phone: string
          plan_id: string | null
          start_date: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expiry_date: string
          id?: string
          name: string
          phone: string
          plan_id?: string | null
          start_date: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expiry_date?: string
          id?: string
          name?: string
          phone?: string
          plan_id?: string | null
          start_date?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          member_id: string
          method: string
          note: string | null
          payment_date: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          member_id: string
          method?: string
          note?: string | null
          payment_date: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          member_id?: string
          method?: string
          note?: string | null
          payment_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          benefits: string[] | null
          category: string | null
          created_at: string | null
          duration_days: number
          id: string
          is_highlighted: boolean | null
          name: string
          price: number
          user_id: string
        }
        Insert: {
          benefits?: string[] | null
          category?: string | null
          created_at?: string | null
          duration_days?: number
          id?: string
          is_highlighted?: boolean | null
          name: string
          price?: number
          user_id: string
        }
        Update: {
          benefits?: string[] | null
          category?: string | null
          created_at?: string | null
          duration_days?: number
          id?: string
          is_highlighted?: boolean | null
          name?: string
          price?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          gym_id: string | null
          id: string
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          gym_id?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          gym_id?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          rating: number
          sort_order: number | null
          text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          rating?: number
          sort_order?: number | null
          text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rating?: number
          sort_order?: number | null
          text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_visible: boolean | null
          name: string
          sort_order: number | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          name: string
          sort_order?: number | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          name?: string
          sort_order?: number | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      trainers: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          sort_order: number | null
          specialization: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          sort_order?: number | null
          specialization?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          sort_order?: number | null
          specialization?: string | null
          user_id?: string
        }
        Relationships: []
      }
      website_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_enabled: boolean
          section_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          section_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          section_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      website_sections: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_visible: boolean | null
          section_type: string
          sort_order: number | null
          subtitle: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          section_type: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          section_type?: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
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
