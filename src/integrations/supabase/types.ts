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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          created_at: string
          drawn_by: string | null
          effect: string
          icon: string
          id: string
          session_id: string
          theme: string
          title: string
        }
        Insert: {
          created_at?: string
          drawn_by?: string | null
          effect: string
          icon?: string
          id?: string
          session_id: string
          theme?: string
          title: string
        }
        Update: {
          created_at?: string
          drawn_by?: string | null
          effect?: string
          icon?: string
          id?: string
          session_id?: string
          theme?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      character_positions: {
        Row: {
          character_id: string
          id: string
          map_id: string
          on_map: boolean
          updated_at: string
          x: number
          y: number
        }
        Insert: {
          character_id: string
          id?: string
          map_id: string
          on_map?: boolean
          updated_at?: string
          x: number
          y: number
        }
        Update: {
          character_id?: string
          id?: string
          map_id?: string
          on_map?: boolean
          updated_at?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_positions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_positions_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          accent_color: string
          archetype: string
          armor_class: number
          hp: number
          id: string
          is_npc: boolean
          level: number
          max_hp: number
          name: string
          notes: string
          session_id: string
          stats: Json
          title: string
        }
        Insert: {
          accent_color?: string
          archetype: string
          armor_class?: number
          hp: number
          id?: string
          is_npc?: boolean
          level?: number
          max_hp: number
          name: string
          notes?: string
          session_id: string
          stats?: Json
          title?: string
        }
        Update: {
          accent_color?: string
          archetype?: string
          armor_class?: number
          hp?: number
          id?: string
          is_npc?: boolean
          level?: number
          max_hp?: number
          name?: string
          notes?: string
          session_id?: string
          stats?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          author_name: string
          body: string
          created_at: string
          id: string
          kind: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          body: string
          created_at?: string
          id?: string
          kind?: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          kind?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      effects: {
        Row: {
          character_id: string
          description: string
          id: string
          kind: string
          name: string
          rounds_left: number
        }
        Insert: {
          character_id: string
          description?: string
          id?: string
          kind: string
          name: string
          rounds_left?: number
        }
        Update: {
          character_id?: string
          description?: string
          id?: string
          kind?: string
          name?: string
          rounds_left?: number
        }
        Relationships: [
          {
            foreignKeyName: "effects_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      fog_cells: {
        Row: {
          cx: number
          cy: number
          map_id: string
          revealed_at: string
        }
        Insert: {
          cx: number
          cy: number
          map_id: string
          revealed_at?: string
        }
        Update: {
          cx?: number
          cy?: number
          map_id?: string
          revealed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fog_cells_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          gm_claimed_at: string | null
          gm_user_id: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          gm_claimed_at?: string | null
          gm_user_id?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          gm_claimed_at?: string | null
          gm_user_id?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          character_id: string
          description: string
          icon: string
          id: string
          name: string
          quantity: number
          rarity: string
          slot: string
        }
        Insert: {
          character_id: string
          description?: string
          icon?: string
          id?: string
          name: string
          quantity?: number
          rarity?: string
          slot?: string
        }
        Update: {
          character_id?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          quantity?: number
          rarity?: string
          slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      maps: {
        Row: {
          cols: number
          description: string
          id: string
          key: string
          name: string
          rows: number
          session_id: string
          sort_order: number
        }
        Insert: {
          cols: number
          description?: string
          id?: string
          key: string
          name: string
          rows: number
          session_id: string
          sort_order?: number
        }
        Update: {
          cols?: number
          description?: string
          id?: string
          key?: string
          name?: string
          rows?: number
          session_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "maps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      story_chapters: {
        Row: {
          body: string
          chapter_number: number
          id: string
          is_active: boolean
          mission: string
          progress: number
          session_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          chapter_number: number
          id?: string
          is_active?: boolean
          mission?: string
          progress?: number
          session_id: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          chapter_number?: number
          id?: string
          is_active?: boolean
          mission?: string
          progress?: number
          session_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_chapters_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_gm: {
        Args: { _session_id: string }
        Returns: {
          created_at: string
          gm_claimed_at: string | null
          gm_user_id: string | null
          id: string
          name: string
          slug: string
        }
        SetofOptions: {
          from: "*"
          to: "game_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_gm: { Args: { _session_id: string }; Returns: boolean }
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
