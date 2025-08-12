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
      anime: {
        Row: {
          anime_id: number
          title_english: string | null
          title_native: string
          title_romaji: string | null
        }
        Insert: {
          anime_id?: number
          title_english?: string | null
          title_native: string
          title_romaji?: string | null
        }
        Update: {
          anime_id?: number
          title_english?: string | null
          title_native?: string
          title_romaji?: string | null
        }
        Relationships: []
      }
      anime_episode: {
        Row: {
          anime_episode_id: number
          anime_id: number
          episode_number: number
          sequence: number
          watched: boolean
        }
        Insert: {
          anime_episode_id?: number
          anime_id: number
          episode_number: number
          sequence: number
          watched?: boolean
        }
        Update: {
          anime_episode_id?: number
          anime_id?: number
          episode_number?: number
          sequence?: number
          watched?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "anime_season_fk"
            columns: ["anime_id", "sequence"]
            isOneToOne: false
            referencedRelation: "anime_season"
            referencedColumns: ["anime_id", "sequence"]
          },
          {
            foreignKeyName: "anime_season_fk"
            columns: ["anime_id", "sequence"]
            isOneToOne: false
            referencedRelation: "anime_season_status_view"
            referencedColumns: ["anime_id", "sequence"]
          },
        ]
      }
      anime_genre: {
        Row: {
          anime_id: number
          genre_id: number
        }
        Insert: {
          anime_id: number
          genre_id: number
        }
        Update: {
          anime_id?: number
          genre_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "anime_fk"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["anime_id"]
          },
          {
            foreignKeyName: "genre_fk"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genre"
            referencedColumns: ["genre_id"]
          },
        ]
      }
      anime_link: {
        Row: {
          anime_id: number
          note: string | null
          platform_id: number
          url: string
        }
        Insert: {
          anime_id: number
          note?: string | null
          platform_id: number
          url: string
        }
        Update: {
          anime_id?: number
          note?: string | null
          platform_id?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "anime_fk"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["anime_id"]
          },
          {
            foreignKeyName: "platform_fk"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platform"
            referencedColumns: ["platform_id"]
          },
        ]
      }
      anime_season: {
        Row: {
          anilist_link: string
          anime_id: number
          episodes: number | null
          format: Database["public"]["Enums"]["typeFormat"]
          season: Database["public"]["Enums"]["typeSeason"] | null
          sequence: number
          title_english: string | null
          title_native: string
          title_romaji: string | null
          year: number | null
        }
        Insert: {
          anilist_link: string
          anime_id: number
          episodes?: number | null
          format: Database["public"]["Enums"]["typeFormat"]
          season?: Database["public"]["Enums"]["typeSeason"] | null
          sequence: number
          title_english?: string | null
          title_native: string
          title_romaji?: string | null
          year?: number | null
        }
        Update: {
          anilist_link?: string
          anime_id?: number
          episodes?: number | null
          format?: Database["public"]["Enums"]["typeFormat"]
          season?: Database["public"]["Enums"]["typeSeason"] | null
          sequence?: number
          title_english?: string | null
          title_native?: string
          title_romaji?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anime_fk"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["anime_id"]
          },
        ]
      }
      anime_season_status: {
        Row: {
          anime_id: number
          sequence: number
          status: Database["public"]["Enums"]["typeSeasonStatus"]
        }
        Insert: {
          anime_id: number
          sequence: number
          status: Database["public"]["Enums"]["typeSeasonStatus"]
        }
        Update: {
          anime_id?: number
          sequence?: number
          status?: Database["public"]["Enums"]["typeSeasonStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "anime_season_fk"
            columns: ["anime_id", "sequence"]
            isOneToOne: true
            referencedRelation: "anime_season"
            referencedColumns: ["anime_id", "sequence"]
          },
          {
            foreignKeyName: "anime_season_fk"
            columns: ["anime_id", "sequence"]
            isOneToOne: true
            referencedRelation: "anime_season_status_view"
            referencedColumns: ["anime_id", "sequence"]
          },
        ]
      }
      changelog: {
        Row: {
          author: string | null
          changelog_id: number
          content: string
          created_at: string
          title: string
        }
        Insert: {
          author?: string | null
          changelog_id?: number
          content: string
          created_at?: string
          title: string
        }
        Update: {
          author?: string | null
          changelog_id?: number
          content?: string
          created_at?: string
          title?: string
        }
        Relationships: []
      }
      episode_link: {
        Row: {
          anime_episode_id: number
          note: string | null
          platform_id: number
          url: string
        }
        Insert: {
          anime_episode_id: number
          note?: string | null
          platform_id: number
          url: string
        }
        Update: {
          anime_episode_id?: number
          note?: string | null
          platform_id?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "anime_episode_fk"
            columns: ["anime_episode_id"]
            isOneToOne: false
            referencedRelation: "anime_episode"
            referencedColumns: ["anime_episode_id"]
          },
          {
            foreignKeyName: "platform_fk"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platform"
            referencedColumns: ["platform_id"]
          },
        ]
      }
      feedback: {
        Row: {
          anonymous_uuid: string | null
          contact_info: string | null
          feedback_id: number
          status: Database["public"]["Enums"]["typeFeedbackStatus"]
          tag: Database["public"]["Enums"]["typeFeedbackTags"]
          text: string
          timestamp: string
        }
        Insert: {
          anonymous_uuid?: string | null
          contact_info?: string | null
          feedback_id?: number
          status?: Database["public"]["Enums"]["typeFeedbackStatus"]
          tag?: Database["public"]["Enums"]["typeFeedbackTags"]
          text: string
          timestamp?: string
        }
        Update: {
          anonymous_uuid?: string | null
          contact_info?: string | null
          feedback_id?: number
          status?: Database["public"]["Enums"]["typeFeedbackStatus"]
          tag?: Database["public"]["Enums"]["typeFeedbackTags"]
          text?: string
          timestamp?: string
        }
        Relationships: []
      }
      genre: {
        Row: {
          genre_id: number
          name: string
        }
        Insert: {
          genre_id?: number
          name: string
        }
        Update: {
          genre_id?: number
          name?: string
        }
        Relationships: []
      }
      platform: {
        Row: {
          name: string
          platform_id: number
          url: string
        }
        Insert: {
          name: string
          platform_id?: number
          url: string
        }
        Update: {
          name?: string
          platform_id?: number
          url?: string
        }
        Relationships: []
      }
      schedule: {
        Row: {
          note: string | null
          schedule_id: number
          week: number
          year: number
        }
        Insert: {
          note?: string | null
          schedule_id?: number
          week: number
          year: number
        }
        Update: {
          note?: string | null
          schedule_id?: number
          week?: number
          year?: number
        }
        Relationships: []
      }
      schedule_anime_detail: {
        Row: {
          schedule_anime_detail_id: number
          schedule_entry_id: number
        }
        Insert: {
          schedule_anime_detail_id?: number
          schedule_entry_id: number
        }
        Update: {
          schedule_anime_detail_id?: number
          schedule_entry_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_entry_fk"
            columns: ["schedule_entry_id"]
            isOneToOne: false
            referencedRelation: "schedule_entry"
            referencedColumns: ["schedule_entry_id"]
          },
        ]
      }
      schedule_anime_episode: {
        Row: {
          anime_episode_id: number
          schedule_anime_detail_id: number
        }
        Insert: {
          anime_episode_id: number
          schedule_anime_detail_id: number
        }
        Update: {
          anime_episode_id?: number
          schedule_anime_detail_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "anime_episode_fk"
            columns: ["anime_episode_id"]
            isOneToOne: false
            referencedRelation: "anime_episode"
            referencedColumns: ["anime_episode_id"]
          },
          {
            foreignKeyName: "schedule_anime_detail_fk"
            columns: ["schedule_anime_detail_id"]
            isOneToOne: false
            referencedRelation: "schedule_anime_detail"
            referencedColumns: ["schedule_anime_detail_id"]
          },
        ]
      }
      schedule_entry: {
        Row: {
          date: string
          note: string | null
          platform_id: number | null
          schedule_entry_id: number
          schedule_id: number
          time: string | null
          type: Database["public"]["Enums"]["typeScheduleEntry"]
        }
        Insert: {
          date: string
          note?: string | null
          platform_id?: number | null
          schedule_entry_id?: number
          schedule_id: number
          time?: string | null
          type: Database["public"]["Enums"]["typeScheduleEntry"]
        }
        Update: {
          date?: string
          note?: string | null
          platform_id?: number | null
          schedule_entry_id?: number
          schedule_id?: number
          time?: string | null
          type?: Database["public"]["Enums"]["typeScheduleEntry"]
        }
        Relationships: [
          {
            foreignKeyName: "platform_fk"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platform"
            referencedColumns: ["platform_id"]
          },
          {
            foreignKeyName: "schedule_fk"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedule"
            referencedColumns: ["schedule_id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          role: Database["public"]["Enums"]["typeUserRole"]
          supabase_id: string | null
          user_id: number
        }
        Insert: {
          email: string
          role?: Database["public"]["Enums"]["typeUserRole"]
          supabase_id?: string | null
          user_id?: number
        }
        Update: {
          email?: string
          role?: Database["public"]["Enums"]["typeUserRole"]
          supabase_id?: string | null
          user_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      anime_season_status_view: {
        Row: {
          anime_id: number | null
          sequence: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anime_fk"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["anime_id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      typeFeedbackStatus: "open" | "inprogress" | "closed" | "wontfix"
      typeFeedbackTags: "bug" | "feature request" | "question" | "other"
      typeFormat:
        | "TV"
        | "TV_SHORT"
        | "MOVIE"
        | "SPECIAL"
        | "OVA"
        | "ONA"
        | "MUSIC"
      typeScheduleEntry: "anime" | "hololive" | "game" | "event" | "sponsored"
      typeSeason: "WINTER" | "SPRING" | "SUMMER" | "FALL"
      typeSeasonStatus: "On hold" | "Dropped"
      typeUserRole: "user" | "admin"
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
      typeFeedbackStatus: ["open", "inprogress", "closed", "wontfix"],
      typeFeedbackTags: ["bug", "feature request", "question", "other"],
      typeFormat: ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"],
      typeScheduleEntry: ["anime", "hololive", "game", "event", "sponsored"],
      typeSeason: ["WINTER", "SPRING", "SUMMER", "FALL"],
      typeSeasonStatus: ["On hold", "Dropped"],
      typeUserRole: ["user", "admin"],
    },
  },
} as const
