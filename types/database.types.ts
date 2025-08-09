export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      sightings: {
        Row: {
          activity: Database["public"]["Enums"]["activity_type"] | null
          activity_other: string | null
          admin_notes: string | null
          cause_of_death:
            | Database["public"]["Enums"]["cause_of_death_type"]
            | null
          cause_of_death_other: string | null
          connection: Database["public"]["Enums"]["connection_type"] | null
          connection_other: string | null
          contact_email: string
          contact_name: string
          contact_postcode: string | null
          created_at: string
          death_details: string | null
          frequency: Database["public"]["Enums"]["frequency_type"] | null
          id: string
          location: unknown
          location_notes: string | null
          nestbox: Database["public"]["Enums"]["nestbox_type"] | null
          observation_period_from: string | null
          observation_period_to: string | null
          observed: Database["public"]["Enums"]["observed_type"][] | null
          sighting_date: string
          site_type: Database["public"]["Enums"]["site_type"] | null
          site_type_other: string | null
          status: string | null
          type: Database["public"]["Enums"]["sighting_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activity?: Database["public"]["Enums"]["activity_type"] | null
          activity_other?: string | null
          admin_notes?: string | null
          cause_of_death?:
            | Database["public"]["Enums"]["cause_of_death_type"]
            | null
          cause_of_death_other?: string | null
          connection?: Database["public"]["Enums"]["connection_type"] | null
          connection_other?: string | null
          contact_email: string
          contact_name: string
          contact_postcode?: string | null
          created_at?: string
          death_details?: string | null
          frequency?: Database["public"]["Enums"]["frequency_type"] | null
          id?: string
          location: unknown
          location_notes?: string | null
          nestbox?: Database["public"]["Enums"]["nestbox_type"] | null
          observation_period_from?: string | null
          observation_period_to?: string | null
          observed?: Database["public"]["Enums"]["observed_type"][] | null
          sighting_date: string
          site_type?: Database["public"]["Enums"]["site_type"] | null
          site_type_other?: string | null
          status?: string | null
          type: Database["public"]["Enums"]["sighting_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activity?: Database["public"]["Enums"]["activity_type"] | null
          activity_other?: string | null
          admin_notes?: string | null
          cause_of_death?:
            | Database["public"]["Enums"]["cause_of_death_type"]
            | null
          cause_of_death_other?: string | null
          connection?: Database["public"]["Enums"]["connection_type"] | null
          connection_other?: string | null
          contact_email?: string
          contact_name?: string
          contact_postcode?: string | null
          created_at?: string
          death_details?: string | null
          frequency?: Database["public"]["Enums"]["frequency_type"] | null
          id?: string
          location?: unknown
          location_notes?: string | null
          nestbox?: Database["public"]["Enums"]["nestbox_type"] | null
          observation_period_from?: string | null
          observation_period_to?: string | null
          observed?: Database["public"]["Enums"]["observed_type"][] | null
          sighting_date?: string
          site_type?: Database["public"]["Enums"]["site_type"] | null
          site_type_other?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["sighting_type"]
          updated_at?: string
          user_id?: string | null
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
      activity_type: "driving" | "walking" | "home" | "other"
      cause_of_death_type:
        | "road-minor"
        | "road-major"
        | "road-motorway"
        | "powerlines"
        | "railway"
        | "drowned"
        | "unknown"
        | "other"
      connection_type: "owner" | "tenant" | "watcher" | "other"
      frequency_type: "once" | "weekly" | "monthly" | "less-monthly"
      nestbox_type: "yes" | "no" | "unknown"
      observed_type:
        | "nest"
        | "roost-regular"
        | "roost-occasional"
        | "fly-in-out"
        | "carrying-food"
        | "young-heard"
      sighting_type: "live" | "site" | "dead"
      site_type:
        | "traditional-farm"
        | "modern-farm"
        | "mixed-farm"
        | "tree-hole"
        | "other"
      status: "pending" | "approved" | "rejected"
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
      activity_type: ["driving", "walking", "home", "other"],
      cause_of_death_type: [
        "road-minor",
        "road-major",
        "road-motorway",
        "powerlines",
        "railway",
        "drowned",
        "unknown",
        "other",
      ],
      connection_type: ["owner", "tenant", "watcher", "other"],
      frequency_type: ["once", "weekly", "monthly", "less-monthly"],
      nestbox_type: ["yes", "no", "unknown"],
      observed_type: [
        "nest",
        "roost-regular",
        "roost-occasional",
        "fly-in-out",
        "carrying-food",
        "young-heard",
      ],
      sighting_type: ["live", "site", "dead"],
      site_type: [
        "traditional-farm",
        "modern-farm",
        "mixed-farm",
        "tree-hole",
        "other",
      ],
      status: ["pending", "approved", "rejected"],
    },
  },
} as const

