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
      achievements: {
        Row: {
          created_at: string | null
          criteria: Json
          description: string
          icon_name: string
          id: string
          image_filename: string | null
          is_active: boolean | null
          is_custom_upload: boolean | null
          name: string
          points_reward: number | null
          scope: string
          storage_path: string | null
          storage_url: string | null
        }
        Insert: {
          created_at?: string | null
          criteria: Json
          description: string
          icon_name: string
          id?: string
          image_filename?: string | null
          is_active?: boolean | null
          is_custom_upload?: boolean | null
          name: string
          points_reward?: number | null
          scope?: string
          storage_path?: string | null
          storage_url?: string | null
        }
        Update: {
          created_at?: string | null
          criteria?: Json
          description?: string
          icon_name?: string
          id?: string
          image_filename?: string | null
          is_active?: boolean | null
          is_custom_upload?: boolean | null
          name?: string
          points_reward?: number | null
          scope?: string
          storage_path?: string | null
          storage_url?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          activity_type: string
          base_points: number | null
          challenge_points_multiplier: number | null
          created_at: string | null
          custom_activity_name: string | null
          description: string | null
          distance_km: number
          duration_minutes: number
          event_id: string | null
          feed_approved: boolean | null
          feed_caption: string | null
          feed_likes: number | null
          feeling: string
          final_points: number | null
          house_points_awarded: number | null
          id: string
          input_type: string
          is_rejected: boolean | null
          is_shared_to_feed: boolean | null
          is_verified: boolean | null
          participation_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          base_points?: number | null
          challenge_points_multiplier?: number | null
          created_at?: string | null
          custom_activity_name?: string | null
          description?: string | null
          distance_km: number
          duration_minutes?: number
          event_id?: string | null
          feed_approved?: boolean | null
          feed_caption?: string | null
          feed_likes?: number | null
          feeling: string
          final_points?: number | null
          house_points_awarded?: number | null
          id?: string
          input_type?: string
          is_rejected?: boolean | null
          is_shared_to_feed?: boolean | null
          is_verified?: boolean | null
          participation_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          base_points?: number | null
          challenge_points_multiplier?: number | null
          created_at?: string | null
          custom_activity_name?: string | null
          description?: string | null
          distance_km?: number
          duration_minutes?: number
          event_id?: string | null
          feed_approved?: boolean | null
          feed_caption?: string | null
          feed_likes?: number | null
          feeling?: string
          final_points?: number | null
          house_points_awarded?: number | null
          id?: string
          input_type?: string
          is_rejected?: boolean | null
          is_shared_to_feed?: boolean | null
          is_verified?: boolean | null
          participation_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activities_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_type_aliases: {
        Row: {
          alias_type: string
          created_at: string | null
          id: string
          primary_type: string
        }
        Insert: {
          alias_type: string
          created_at?: string | null
          id?: string
          primary_type: string
        }
        Update: {
          alias_type?: string
          created_at?: string | null
          id?: string
          primary_type?: string
        }
        Relationships: []
      }
      allowed_emails: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          note: string | null
          school_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          note?: string | null
          school_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          note?: string | null
          school_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allowed_emails_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allowed_emails_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allowed_emails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assembly_draw_winners: {
        Row: {
          created_at: string | null
          drawn_by: string
          house_color: string | null
          house_name: string | null
          id: string
          school_id: string
          user_first_name: string
          user_id: string | null
          user_last_name: string
          user_username: string
        }
        Insert: {
          created_at?: string | null
          drawn_by: string
          house_color?: string | null
          house_name?: string | null
          id?: string
          school_id: string
          user_first_name: string
          user_id?: string | null
          user_last_name: string
          user_username: string
        }
        Update: {
          created_at?: string | null
          drawn_by?: string
          house_color?: string | null
          house_name?: string | null
          id?: string
          school_id?: string
          user_first_name?: string
          user_id?: string | null
          user_last_name?: string
          user_username?: string
        }
        Relationships: [
          {
            foreignKeyName: "assembly_draw_winners_drawn_by_fkey"
            columns: ["drawn_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assembly_draw_winners_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assembly_draw_winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_emails: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          note: string | null
          school_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          note?: string | null
          school_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          note?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_emails_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          total_distance: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          total_distance?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          total_distance?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          approval_status: string | null
          badge_achievement_id: string | null
          challenge_points: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          event_image_storage_path: string | null
          event_image_url: string | null
          event_type: string
          icon_type: string | null
          id: string
          image_path: string | null
          image_url: string | null
          is_active: boolean | null
          is_assembly: boolean | null
          is_published: boolean
          is_student_suggested: boolean
          last_interaction_at: string | null
          name: string
          participant_count: number | null
          points_multiplier: number | null
          poster_path: string | null
          poster_url: string | null
          rejection_reason: string | null
          start_date: string
          suggestion_image_path: string | null
          suggestion_image_url: string | null
          target_distance: number | null
          target_minutes: number | null
          target_schools: string[] | null
          updated_at: string | null
          video_path: string | null
          video_url: string | null
          youtube_video_url: string | null
        }
        Insert: {
          approval_status?: string | null
          badge_achievement_id?: string | null
          challenge_points?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          event_image_storage_path?: string | null
          event_image_url?: string | null
          event_type: string
          icon_type?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_assembly?: boolean | null
          is_published?: boolean
          is_student_suggested?: boolean
          last_interaction_at?: string | null
          name: string
          participant_count?: number | null
          points_multiplier?: number | null
          poster_path?: string | null
          poster_url?: string | null
          rejection_reason?: string | null
          start_date: string
          suggestion_image_path?: string | null
          suggestion_image_url?: string | null
          target_distance?: number | null
          target_minutes?: number | null
          target_schools?: string[] | null
          updated_at?: string | null
          video_path?: string | null
          video_url?: string | null
          youtube_video_url?: string | null
        }
        Update: {
          approval_status?: string | null
          badge_achievement_id?: string | null
          challenge_points?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          event_image_storage_path?: string | null
          event_image_url?: string | null
          event_type?: string
          icon_type?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_assembly?: boolean | null
          is_published?: boolean
          is_student_suggested?: boolean
          last_interaction_at?: string | null
          name?: string
          participant_count?: number | null
          points_multiplier?: number | null
          poster_path?: string | null
          poster_url?: string | null
          rejection_reason?: string | null
          start_date?: string
          suggestion_image_path?: string | null
          suggestion_image_url?: string | null
          target_distance?: number | null
          target_minutes?: number | null
          target_schools?: string[] | null
          updated_at?: string | null
          video_path?: string | null
          video_url?: string | null
          youtube_video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_badge_achievement_id_fkey"
            columns: ["badge_achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      house_achievements: {
        Row: {
          achievement_description: string | null
          achievement_id: string | null
          achievement_name: string
          created_at: string | null
          criteria: Json | null
          house_color: string
          house_id: string
          house_name: string
          icon_name: string | null
          id: string
          image_filename: string | null
          points_reward: number | null
          school_id: string
          storage_url: string | null
          term_id: string | null
        }
        Insert: {
          achievement_description?: string | null
          achievement_id?: string | null
          achievement_name: string
          created_at?: string | null
          criteria?: Json | null
          house_color?: string
          house_id: string
          house_name?: string
          icon_name?: string | null
          id?: string
          image_filename?: string | null
          points_reward?: number | null
          school_id: string
          storage_url?: string | null
          term_id?: string | null
        }
        Update: {
          achievement_description?: string | null
          achievement_id?: string | null
          achievement_name?: string
          created_at?: string | null
          criteria?: Json | null
          house_color?: string
          house_id?: string
          house_name?: string
          icon_name?: string | null
          id?: string
          image_filename?: string | null
          points_reward?: number | null
          school_id?: string
          storage_url?: string | null
          term_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "house_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_achievements_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_achievements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_achievements_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "school_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      houses: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          school_id: string | null
          term_points: number | null
          total_kilometers: number | null
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          name: string
          school_id?: string | null
          term_points?: number | null
          total_kilometers?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          school_id?: string | null
          term_points?: number | null
          total_kilometers?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "houses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      korero_votes: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          interest_level: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          interest_level: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          interest_level?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "korero_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_assets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          file_path: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          is_active: boolean
          name: string
          school_ids: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          is_active?: boolean
          name: string
          school_ids?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          is_active?: boolean
          name?: string
          school_ids?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotional_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      school_admins: {
        Row: {
          created_at: string | null
          id: string
          school_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          school_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          school_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_admins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      school_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_messages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      school_terms: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_current: boolean | null
          name: string
          school_id: string
          start_date: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_current?: boolean | null
          name: string
          school_id: string
          start_date: string
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_current?: boolean | null
          name?: string
          school_id?: string
          start_date?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "school_terms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_update_reads: {
        Row: {
          id: string
          read_at: string
          update_id: string
          user_id: string
        }
        Insert: {
          id?: string
          read_at?: string
          update_id: string
          user_id: string
        }
        Update: {
          id?: string
          read_at?: string
          update_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_update_reads_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "school_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_update_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      school_updates: {
        Row: {
          body: string | null
          created_at: string
          created_by: string
          id: string
          image_storage_path: string | null
          image_url: string | null
          is_active: boolean
          school_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by: string
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          is_active?: boolean
          school_id: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          is_active?: boolean
          school_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_updates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          code: string
          created_at: string | null
          current_term_id: string | null
          email_domain: string | null
          id: string
          is_active: boolean | null
          is_internal: boolean | null
          join_code: string | null
          join_link_active: boolean | null
          name: string
          region: string | null
          registration_method: string
          rejection_reason: string | null
          school_type: string | null
          secondary_email_domain: string | null
          self_registered: boolean | null
          status: string | null
          term_points: number | null
          total_kilometers: number | null
          total_points: number | null
          total_students: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          code: string
          created_at?: string | null
          current_term_id?: string | null
          email_domain?: string | null
          id?: string
          is_active?: boolean | null
          is_internal?: boolean | null
          join_code?: string | null
          join_link_active?: boolean | null
          name: string
          region?: string | null
          registration_method?: string
          rejection_reason?: string | null
          school_type?: string | null
          secondary_email_domain?: string | null
          self_registered?: boolean | null
          status?: string | null
          term_points?: number | null
          total_kilometers?: number | null
          total_points?: number | null
          total_students?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          created_at?: string | null
          current_term_id?: string | null
          email_domain?: string | null
          id?: string
          is_active?: boolean | null
          is_internal?: boolean | null
          join_code?: string | null
          join_link_active?: boolean | null
          name?: string
          region?: string | null
          registration_method?: string
          rejection_reason?: string | null
          school_type?: string | null
          secondary_email_domain?: string | null
          self_registered?: boolean | null
          status?: string | null
          term_points?: number | null
          total_kilometers?: number | null
          total_points?: number | null
          total_students?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_current_term_id_fkey"
            columns: ["current_term_id"]
            isOneToOne: false
            referencedRelation: "school_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_invites: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          answer_options: Json | null
          created_at: string | null
          display_order: number
          id: string
          is_required: boolean | null
          question_text: string
          question_type: string
          survey_id: string
        }
        Insert: {
          answer_options?: Json | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_required?: boolean | null
          question_text: string
          question_type: string
          survey_id: string
        }
        Update: {
          answer_options?: Json | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_required?: boolean | null
          question_text?: string
          question_type?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          answer: Json
          created_at: string | null
          id: string
          question_id: string
          survey_id: string
          user_id: string
        }
        Insert: {
          answer: Json
          created_at?: string | null
          id?: string
          question_id: string
          survey_id: string
          user_id: string
        }
        Update: {
          answer?: Json
          created_at?: string | null
          id?: string
          question_id?: string
          survey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          survey_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          survey_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          survey_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          created_at: string | null
          earned_at: string | null
          house_id: string | null
          id: string
          term_id: string | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          created_at?: string | null
          earned_at?: string | null
          house_id?: string | null
          id?: string
          term_id?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          created_at?: string | null
          earned_at?: string | null
          house_id?: string | null
          id?: string
          term_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "school_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_survey_status: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          status: string
          survey_type: string
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          status?: string
          survey_type: string
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          status?: string
          survey_type?: string
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_survey_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          class: string | null
          created_at: string | null
          current_streak: number | null
          first_name: string
          house_id: string | null
          house_rank: number | null
          id: string
          is_active: boolean
          is_admin: boolean | null
          is_deleted: boolean
          is_public: boolean | null
          last_activity_date: string | null
          last_name: string
          longest_streak: number | null
          monthly_goal_minutes: number | null
          overall_rank: number | null
          profile_icon_url: string | null
          role: string | null
          school_id: string | null
          school_rank: number | null
          social_handle: string | null
          total_kilometers: number | null
          total_minutes: number | null
          total_points: number | null
          updated_at: string | null
          username: string
          year_group: string | null
          year_group_rank: number | null
        }
        Insert: {
          class?: string | null
          created_at?: string | null
          current_streak?: number | null
          first_name: string
          house_id?: string | null
          house_rank?: number | null
          id: string
          is_active?: boolean
          is_admin?: boolean | null
          is_deleted?: boolean
          is_public?: boolean | null
          last_activity_date?: string | null
          last_name: string
          longest_streak?: number | null
          monthly_goal_minutes?: number | null
          overall_rank?: number | null
          profile_icon_url?: string | null
          role?: string | null
          school_id?: string | null
          school_rank?: number | null
          social_handle?: string | null
          total_kilometers?: number | null
          total_minutes?: number | null
          total_points?: number | null
          updated_at?: string | null
          username: string
          year_group?: string | null
          year_group_rank?: number | null
        }
        Update: {
          class?: string | null
          created_at?: string | null
          current_streak?: number | null
          first_name?: string
          house_id?: string | null
          house_rank?: number | null
          id?: string
          is_active?: boolean
          is_admin?: boolean | null
          is_deleted?: boolean
          is_public?: boolean | null
          last_activity_date?: string | null
          last_name?: string
          longest_streak?: number | null
          monthly_goal_minutes?: number | null
          overall_rank?: number | null
          profile_icon_url?: string | null
          role?: string | null
          school_id?: string | null
          school_rank?: number | null
          social_handle?: string | null
          total_kilometers?: number | null
          total_minutes?: number | null
          total_points?: number | null
          updated_at?: string | null
          username?: string
          year_group?: string | null
          year_group_rank?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_super_admin_invite: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_token: string
          p_username: string
        }
        Returns: boolean
      }
      auto_unpublish_stale_events: { Args: never; Returns: number }
      calculate_user_streak: {
        Args: { user_id_param: string }
        Returns: {
          current_streak_days: number
          last_activity_date_calc: string
          longest_streak_days: number
        }[]
      }
      current_user_is_super_admin: { Args: never; Returns: boolean }
      current_user_school_id: { Args: never; Returns: string }
      fix_all_broken_streaks: {
        Args: never
        Returns: {
          fixed_count: number
          message: string
        }[]
      }
      fix_user_streak: {
        Args: { p_user_id: string }
        Returns: {
          current_streak: number
          last_activity_date: string
          longest_streak: number
          message: string
          username: string
        }[]
      }
      get_activity_type_counts: {
        Args: never
        Returns: {
          activity_type: string
          count: number
        }[]
      }
      get_current_term: {
        Args: { p_school_id: string }
        Returns: {
          created_at: string | null
          end_date: string
          id: string
          is_current: boolean | null
          name: string
          school_id: string
          start_date: string
          updated_at: string | null
          year: number
        }
        SetofOptions: {
          from: "*"
          to: "school_terms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_school_join_code: {
        Args: { p_school_id: string }
        Returns: {
          code: string
          join_code: string
          join_link_active: boolean
        }[]
      }
      get_school_monthly_progress: {
        Args: { p_school_id: string }
        Returns: {
          active_students: number
          avg_minutes_per_student: number
          month: string
          total_activities: number
          total_minutes: number
          total_points: number
          total_students: number
        }[]
      }
      get_super_admin_invite: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          id: string
          used_at: string
        }[]
      }
      get_term_points: {
        Args: { p_entity_id: string; p_entity_type: string; p_term_id: string }
        Returns: number
      }
      get_user_current_month_progress: {
        Args: { p_user_id: string }
        Returns: {
          current_month_activities: number
          current_month_minutes: number
          current_month_points: number
          days_in_month: number
          days_remaining: number
          month_start: string
        }[]
      }
      get_user_emails_by_ids: {
        Args: { user_ids: string[] }
        Returns: {
          email: string
          id: string
        }[]
      }
      get_user_monthly_history: {
        Args: { p_months_back?: number; p_user_id: string }
        Returns: {
          active_days: number
          activity_count: number
          goal_completion_percent: number
          goal_minutes: number
          month: string
          total_minutes: number
          total_points: number
        }[]
      }
      get_user_rankings: {
        Args: { p_user_id: string }
        Returns: {
          house_rank: number
          house_total_users: number
          overall_rank: number
          overall_total_users: number
          school_rank: number
          school_total_users: number
          year_group_rank: number
          year_group_total_users: number
        }[]
      }
      hard_delete_school: { Args: { p_school_id: string }; Returns: undefined }
      hard_delete_user: { Args: { p_user_id: string }; Returns: undefined }
      increment_feed_like: {
        Args: { p_activity_id: string }
        Returns: undefined
      }
      is_email_allowed: {
        Args: { p_email: string; p_school_id: string }
        Returns: boolean
      }
      lookup_school_by_join_code: {
        Args: { p_join_code: string }
        Returns: {
          id: string
          is_active: boolean
          name: string
        }[]
      }
      recalculate_all_rankings: { Args: never; Returns: undefined }
      recalculate_all_user_streaks: { Args: never; Returns: undefined }
      recalculate_house_points: { Args: never; Returns: undefined }
      recalculate_house_totals: { Args: never; Returns: undefined }
      recalculate_school_points: { Args: never; Returns: undefined }
      recalculate_school_totals: { Args: never; Returns: undefined }
      reset_term_points: { Args: { p_school_id: string }; Returns: undefined }
      update_house_totals_from_house: {
        Args: { p_house_id: string }
        Returns: undefined
      }
      update_school_totals_from_school: {
        Args: { p_school_id: string }
        Returns: undefined
      }
      update_user_rankings: { Args: never; Returns: undefined }
      update_user_streak_for_date: {
        Args: { p_activity_date: string; p_user_id: string }
        Returns: undefined
      }
      use_super_admin_invite: {
        Args: { p_token: string; p_user_id: string }
        Returns: boolean
      }
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
