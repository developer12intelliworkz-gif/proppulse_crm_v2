export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_role: {
        Row: {
          app_role: string
          created_at: string
          id: number
        }
        Insert: {
          app_role: string
          created_at?: string
          id?: number
        }
        Update: {
          app_role?: string
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      contact: {
        Row: {
          created_at: string
          email: string | null
          id: number
          location: string | null
          name: string | null
          phone: string | null
          status: Database["public"]["Enums"]["lead"] | null
          type: Database["public"]["Enums"]["type"]
          user_id: number | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          location?: string | null
          name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["lead"] | null
          type: Database["public"]["Enums"]["type"]
          user_id?: number | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          location?: string | null
          name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["lead"] | null
          type?: Database["public"]["Enums"]["type"]
          user_id?: number | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          assigned_agent: string | null
          budget: string | null
          campaign_source: string | null
          communication_preference: string | null
          created_at: string | null
          current_scenario: string | null
          email: string | null
          id: string
          last_contact: string | null
          lead_score: number | null
          lead_source: string | null
          lead_source_details: string | null
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          properties: number | null
          referral_source: string | null
          requirements: string | null
          social_media: string | null
          status: string | null
          timeline: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          assigned_agent?: string | null
          budget?: string | null
          campaign_source?: string | null
          communication_preference?: string | null
          created_at?: string | null
          current_scenario?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_source_details?: string | null
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          properties?: number | null
          referral_source?: string | null
          requirements?: string | null
          social_media?: string | null
          status?: string | null
          timeline?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          assigned_agent?: string | null
          budget?: string | null
          campaign_source?: string | null
          communication_preference?: string | null
          created_at?: string | null
          current_scenario?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_source_details?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          properties?: number | null
          referral_source?: string | null
          requirements?: string | null
          social_media?: string | null
          status?: string | null
          timeline?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          contact: string
          created_at: string | null
          description: string | null
          due_date: string
          due_time: string | null
          id: string
          priority: string | null
          property: string | null
          status: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          contact: string
          created_at?: string | null
          description?: string | null
          due_date: string
          due_time?: string | null
          id?: string
          priority?: string | null
          property?: string | null
          status?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          contact?: string
          created_at?: string | null
          description?: string | null
          due_date?: string
          due_time?: string | null
          id?: string
          priority?: string | null
          property?: string | null
          status?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_banners: {
        Row: {
          banner_url: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          project_id: string | null
        }
        Insert: {
          banner_url: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          project_id?: string | null
        }
        Update: {
          banner_url?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_banners_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_brochures: {
        Row: {
          active: boolean | null
          attachments: string[] | null
          content: string | null
          created_at: string | null
          id: string
          name: string
          project_id: string | null
          subject: string | null
        }
        Insert: {
          active?: boolean | null
          attachments?: string[] | null
          content?: string | null
          created_at?: string | null
          id?: string
          name: string
          project_id?: string | null
          subject?: string | null
        }
        Update: {
          active?: boolean | null
          attachments?: string[] | null
          content?: string | null
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_brochures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_price_quotes: {
        Row: {
          active: boolean | null
          attachments: string[] | null
          content: string | null
          created_at: string | null
          id: string
          project_id: string | null
          subject: string | null
        }
        Insert: {
          active?: boolean | null
          attachments?: string[] | null
          content?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          subject?: string | null
        }
        Update: {
          active?: boolean | null
          attachments?: string[] | null
          content?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_price_quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_specifications: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          project_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_specifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          amenities: Json | null
          city: string | null
          completed_steps: Json | null
          country: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          enable_vr: boolean | null
          expected_completion: string | null
          id: string
          india_property_code: string | null
          inventory: boolean | null
          is_active: boolean | null
          latitude: string | null
          launched_on: string | null
          locality: string | null
          longitude: string | null
          magicbricks_code: string | null
          name: string
          notify_to_emails: string[] | null
          possession: string | null
          rera_project_id: string | null
          sales: string | null
          search_address: string | null
          state: string | null
          status: string | null
          street: string | null
          updated_at: string | null
          vr_app_id: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          city?: string | null
          completed_steps?: Json | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          enable_vr?: boolean | null
          expected_completion?: string | null
          id?: string
          india_property_code?: string | null
          inventory?: boolean | null
          is_active?: boolean | null
          latitude?: string | null
          launched_on?: string | null
          locality?: string | null
          longitude?: string | null
          magicbricks_code?: string | null
          name: string
          notify_to_emails?: string[] | null
          possession?: string | null
          rera_project_id?: string | null
          sales?: string | null
          search_address?: string | null
          state?: string | null
          status?: string | null
          street?: string | null
          updated_at?: string | null
          vr_app_id?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          city?: string | null
          completed_steps?: Json | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          enable_vr?: boolean | null
          expected_completion?: string | null
          id?: string
          india_property_code?: string | null
          inventory?: boolean | null
          is_active?: boolean | null
          latitude?: string | null
          launched_on?: string | null
          locality?: string | null
          longitude?: string | null
          magicbricks_code?: string | null
          name?: string
          notify_to_emails?: string[] | null
          possession?: string | null
          rera_project_id?: string | null
          sales?: string | null
          search_address?: string | null
          state?: string | null
          status?: string | null
          street?: string | null
          updated_at?: string | null
          vr_app_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          agent: string | null
          baths: number | null
          beds: number | null
          city: string
          created_at: string | null
          description: string | null
          id: string
          listing_date: string | null
          price: number | null
          sqft: number | null
          state: string
          status: string | null
          type: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address: string
          agent?: string | null
          baths?: number | null
          beds?: number | null
          city: string
          created_at?: string | null
          description?: string | null
          id?: string
          listing_date?: string | null
          price?: number | null
          sqft?: number | null
          state: string
          status?: string | null
          type?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string
          agent?: string | null
          baths?: number | null
          beds?: number | null
          city?: string
          created_at?: string | null
          description?: string | null
          id?: string
          listing_date?: string | null
          price?: number | null
          sqft?: number | null
          state?: string
          status?: string | null
          type?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          UUID: number
        }
        Insert: {
          created_at?: string
          role?: string
          UUID?: number
        }
        Update: {
          created_at?: string
          role?: string
          UUID?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          assigned_leads: number | null
          avatar: string | null
          converted_leads: number | null
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          name: string
          password: string
          phone: string | null
          photo: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_leads?: number | null
          avatar?: string | null
          converted_leads?: number | null
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          name: string
          password: string
          phone?: string | null
          photo?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_leads?: number | null
          avatar?: string | null
          converted_leads?: number | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          name?: string
          password?: string
          phone?: string | null
          photo?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_stats: {
        Row: {
          assigned_leads: number | null
          converted_leads: number | null
          created_at: string | null
          email: string | null
          id: string | null
          last_login: string | null
          name: string | null
          role: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_uuid?: string }
        Returns: string
      }
      has_permission: {
        Args: { permission_type: string }
        Returns: boolean
      }
    }
    Enums: {
      lead: "Active" | "Inactive"
      type: "Buyer" | "Seller" | "Investor"
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
      lead: ["Active", "Inactive"],
      type: ["Buyer", "Seller", "Investor"],
    },
  },
} as const
