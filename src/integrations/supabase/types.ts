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
      parks: {
        Row: {
          address: string | null
          big_rig_friendly: string | null
          cell_quality: string | null
          city: string | null
          key_amenities: string | null
          last_updated: string
          lat: number | null
          lon: number | null
          membership_type: string | null
          nearby_highlights: string | null
          notes: string | null
          park_id: string
          park_name: string
          region: string | null
          state: string | null
        }
        Insert: {
          address?: string | null
          big_rig_friendly?: string | null
          cell_quality?: string | null
          city?: string | null
          key_amenities?: string | null
          last_updated?: string
          lat?: number | null
          lon?: number | null
          membership_type?: string | null
          nearby_highlights?: string | null
          notes?: string | null
          park_id: string
          park_name: string
          region?: string | null
          state?: string | null
        }
        Update: {
          address?: string | null
          big_rig_friendly?: string | null
          cell_quality?: string | null
          city?: string | null
          key_amenities?: string | null
          last_updated?: string
          lat?: number | null
          lon?: number | null
          membership_type?: string | null
          nearby_highlights?: string | null
          notes?: string | null
          park_id?: string
          park_name?: string
          region?: string | null
          state?: string | null
        }
        Relationships: []
      }
      reviews_community: {
        Row: {
          big_rig_flag: string | null
          created_at: string
          park_id: string | null
          park_name: string | null
          raw_quote: string | null
          review_date: string | null
          review_id: string
          sentiment: string | null
          source_type: string | null
          source_url: string | null
          summary: string | null
          tags: string | null
        }
        Insert: {
          big_rig_flag?: string | null
          created_at?: string
          park_id?: string | null
          park_name?: string | null
          raw_quote?: string | null
          review_date?: string | null
          review_id: string
          sentiment?: string | null
          source_type?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string | null
        }
        Update: {
          big_rig_flag?: string | null
          created_at?: string
          park_id?: string | null
          park_name?: string | null
          raw_quote?: string | null
          review_date?: string | null
          review_id?: string
          sentiment?: string | null
          source_type?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_community_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["park_id"]
          },
        ]
      }
      reviews_personal: {
        Row: {
          big_rig_verdict: string | null
          created_at: string
          entry_id: string
          notes: string | null
          park_id: string | null
          park_name: string | null
          rating_amenities: number | null
          rating_cell: number | null
          rating_overall: number | null
          rating_sites: number | null
          stay_end: string | null
          stay_start: string | null
          tags: string | null
        }
        Insert: {
          big_rig_verdict?: string | null
          created_at?: string
          entry_id?: string
          notes?: string | null
          park_id?: string | null
          park_name?: string | null
          rating_amenities?: number | null
          rating_cell?: number | null
          rating_overall?: number | null
          rating_sites?: number | null
          stay_end?: string | null
          stay_start?: string | null
          tags?: string | null
        }
        Update: {
          big_rig_verdict?: string | null
          created_at?: string
          entry_id?: string
          notes?: string | null
          park_id?: string | null
          park_name?: string | null
          rating_amenities?: number | null
          rating_cell?: number | null
          rating_overall?: number | null
          rating_sites?: number | null
          stay_end?: string | null
          stay_start?: string | null
          tags?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_personal_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["park_id"]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
