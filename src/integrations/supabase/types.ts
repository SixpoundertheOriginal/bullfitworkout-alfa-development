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
      activities: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          metadata: Json | null
          task_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          metadata?: Json | null
          task_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          metadata?: Json | null
          task_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          calendar_id: string | null
          created_at: string
          description: string | null
          end_time: string | null
          external_event_id: string | null
          id: string
          integration_id: string | null
          last_synced_at: string | null
          location: string | null
          recurrence: string[] | null
          start_time: string | null
          status: string | null
          task_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          calendar_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          external_event_id?: string | null
          id?: string
          integration_id?: string | null
          last_synced_at?: string | null
          location?: string | null
          recurrence?: string[] | null
          start_time?: string | null
          status?: string | null
          task_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          calendar_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          external_event_id?: string | null
          id?: string
          integration_id?: string | null
          last_synced_at?: string | null
          location?: string | null
          recurrence?: string[] | null
          start_time?: string | null
          status?: string | null
          task_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          created_by: string
          edited: boolean
          id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          edited?: boolean
          id?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          edited?: boolean
          id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      completed_workouts: {
        Row: {
          calories_burned: number | null
          created_at: string
          description: string | null
          duration: number
          end_time: string
          exercises: Json
          id: string
          metrics: Json | null
          name: string
          notes: string | null
          rating: number | null
          start_time: string
          template_id: string | null
          training_type: Database["public"]["Enums"]["training_type"]
          user_id: string
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          description?: string | null
          duration: number
          end_time: string
          exercises: Json
          id?: string
          metrics?: Json | null
          name: string
          notes?: string | null
          rating?: number | null
          start_time: string
          template_id?: string | null
          training_type: Database["public"]["Enums"]["training_type"]
          user_id: string
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          description?: string | null
          duration?: number
          end_time?: string
          exercises?: Json
          id?: string
          metrics?: Json | null
          name?: string
          notes?: string | null
          rating?: number | null
          start_time?: string
          template_id?: string | null
          training_type?: Database["public"]["Enums"]["training_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completed_workouts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_training_types: {
        Row: {
          color_end: string
          color_start: string
          created_at: string
          icon: string
          id: string
          name: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          color_end?: string
          color_start?: string
          created_at?: string
          icon: string
          id?: string
          name: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          color_end?: string
          color_start?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          created_at: string
          daily_summary: boolean | null
          email_address: string | null
          forward_address: string | null
          id: string
          notification_preferences: Json | null
          summary_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_summary?: boolean | null
          email_address?: string | null
          forward_address?: string | null
          id?: string
          notification_preferences?: Json | null
          summary_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_summary?: boolean | null
          email_address?: string | null
          forward_address?: string | null
          id?: string
          notification_preferences?: Json | null
          summary_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_performances: {
        Row: {
          created_at: string
          date: string
          exercise_id: string
          id: string
          max_weight: number
          sets: number
          total_reps: number
          total_volume: number
          user_id: string
          workout_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          exercise_id: string
          id?: string
          max_weight: number
          sets: number
          total_reps: number
          total_volume: number
          user_id: string
          workout_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          exercise_id?: string
          id?: string
          max_weight?: number
          sets?: number
          total_reps?: number
          total_volume?: number
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_performances_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "completed_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_progression: {
        Row: {
          created_at: string | null
          difficulty_level: number | null
          energy_level: number | null
          exercise_name: string
          id: string
          metadata: Json | null
          performance_rating: number | null
          time_of_day: string | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty_level?: number | null
          energy_level?: number | null
          exercise_name: string
          id?: string
          metadata?: Json | null
          performance_rating?: number | null
          time_of_day?: string | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty_level?: number | null
          energy_level?: number | null
          exercise_name?: string
          id?: string
          metadata?: Json | null
          performance_rating?: number | null
          time_of_day?: string | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_progression_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_sets: {
        Row: {
          completed: boolean
          created_at: string
          exercise_name: string
          id: string
          reps: number
          rest_time: number | null
          set_number: number
          weight: number
          workout_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          exercise_name: string
          id?: string
          reps: number
          rest_time?: number | null
          set_number: number
          weight: number
          workout_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          exercise_name?: string
          id?: string
          reps?: number
          rest_time?: number | null
          set_number?: number
          weight?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          base_exercise_id: string | null
          created_at: string
          created_by: string | null
          description: string
          difficulty: string
          equipment_type: string[]
          id: string
          instructions: Json
          is_compound: boolean
          is_custom: boolean | null
          media_urls: Json | null
          metadata: Json | null
          movement_pattern: string
          name: string
          primary_muscle_groups: string[]
          secondary_muscle_groups: string[]
          tips: string[] | null
          updated_at: string
          variation_type: string | null
          variation_value: string | null
          variations: string[] | null
        }
        Insert: {
          base_exercise_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          difficulty: string
          equipment_type: string[]
          id?: string
          instructions: Json
          is_compound: boolean
          is_custom?: boolean | null
          media_urls?: Json | null
          metadata?: Json | null
          movement_pattern: string
          name: string
          primary_muscle_groups: string[]
          secondary_muscle_groups: string[]
          tips?: string[] | null
          updated_at?: string
          variation_type?: string | null
          variation_value?: string | null
          variations?: string[] | null
        }
        Update: {
          base_exercise_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          equipment_type?: string[]
          id?: string
          instructions?: Json
          is_compound?: boolean
          is_custom?: boolean | null
          media_urls?: Json | null
          metadata?: Json | null
          movement_pattern?: string
          name?: string
          primary_muscle_groups?: string[]
          secondary_muscle_groups?: string[]
          tips?: string[] | null
          updated_at?: string
          variation_type?: string | null
          variation_value?: string | null
          variations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_base_exercise_id_fkey"
            columns: ["base_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_logs: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          source: string
          training_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          source: string
          training_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          source?: string
          training_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      favorite_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_progress: {
        Row: {
          goal_id: string
          id: string
          notes: string | null
          recorded_at: string
          user_id: string
          value: number
          workout_id: string | null
        }
        Insert: {
          goal_id: string
          id?: string
          notes?: string | null
          recorded_at?: string
          user_id: string
          value: number
          workout_id?: string | null
        }
        Update: {
          goal_id?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          user_id?: string
          value?: number
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "user_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_progress_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          provider: string
          provider_user_id: string | null
          refresh_token: string | null
          scopes: string[] | null
          settings: Json | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          provider: string
          provider_user_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          settings?: Json | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          provider?: string
          provider_user_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          settings?: Json | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      movement_pattern_analytics: {
        Row: {
          created_at: string | null
          id: string
          primary_pattern: string
          secondary_pattern: string
          synergy_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          primary_pattern: string
          secondary_pattern: string
          synergy_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          primary_pattern?: string
          secondary_pattern?: string
          synergy_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          created_at: string
          date: string
          equipment_type: string
          exercise_id: string
          exercise_name: string
          id: string
          notes: string | null
          previous_record: Json | null
          type: string
          unit: string
          user_id: string
          value: number
          workout_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          equipment_type: string
          exercise_id: string
          exercise_name: string
          id?: string
          notes?: string | null
          previous_record?: Json | null
          type: string
          unit: string
          user_id: string
          value: number
          workout_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          equipment_type?: string
          exercise_id?: string
          exercise_name?: string
          id?: string
          notes?: string | null
          previous_record?: Json | null
          type?: string
          unit?: string
          user_id?: string
          value?: number
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "completed_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          parent_project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_setup_templates: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number
          id: string
          is_system_generated: boolean | null
          name: string
          suggested_exercises: string[] | null
          tags: string[] | null
          time_of_day: string | null
          training_type: string
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          is_system_generated?: boolean | null
          name: string
          suggested_exercises?: string[] | null
          tags?: string[] | null
          time_of_day?: string | null
          training_type: string
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          is_system_generated?: boolean | null
          name?: string
          suggested_exercises?: string[] | null
          tags?: string[] | null
          time_of_day?: string | null
          training_type?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      rest_period_analytics: {
        Row: {
          created_at: string | null
          exercise_name: string
          id: string
          rest_duration: number
          subsequent_performance_impact: number | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_name: string
          id?: string
          rest_duration: number
          subsequent_performance_impact?: number | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_name?: string
          id?: string
          rest_duration?: number
          subsequent_performance_impact?: number | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rest_period_analytics_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          task_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          task_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          task_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          original_name: string
          storage_path: string
          task_id: string
          thumbnail_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          original_name: string
          storage_path: string
          task_id: string
          thumbnail_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          original_name?: string
          storage_path?: string
          task_id?: string
          thumbnail_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_groups: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          tags: string[] | null
          task_group_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          task_group_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          task_group_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_task_group_id_fkey"
            columns: ["task_group_id"]
            isOneToOne: false
            referencedRelation: "task_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      template_usage: {
        Row: {
          created_at: string
          id: string
          task_id: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_usage_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          last_used: string | null
          name: string
          structure: Json
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          last_used?: string | null
          name: string
          structure: Json
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          last_used?: string | null
          name?: string
          structure?: Json
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string
          current_value: number | null
          description: string | null
          goal_type: string
          id: string
          last_updated: string | null
          measurement_unit: string | null
          recurrence: string | null
          start_date: string
          start_value: number | null
          status: string | null
          target_date: string | null
          target_value: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          goal_type: string
          id?: string
          last_updated?: string | null
          measurement_unit?: string | null
          recurrence?: string | null
          start_date?: string
          start_value?: number | null
          status?: string | null
          target_date?: string | null
          target_value: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          last_updated?: string | null
          measurement_unit?: string | null
          recurrence?: string | null
          start_date?: string
          start_value?: number | null
          status?: string | null
          target_date?: string | null
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_metrics: {
        Row: {
          body_fat_percentage: number | null
          created_at: string
          date: string
          height: number
          height_unit: string
          id: string
          measurements: Json | null
          user_id: string
          weight: number
          weight_unit: string
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string
          date: string
          height: number
          height_unit: string
          id?: string
          measurements?: Json | null
          user_id: string
          weight: number
          weight_unit: string
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string
          date?: string
          height?: number
          height_unit?: string
          id?: string
          measurements?: Json | null
          user_id?: string
          weight?: number
          weight_unit?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          age: number | null
          created_at: string
          experience_level: string | null
          fitness_goal: string | null
          full_name: string | null
          height: number | null
          height_unit: string | null
          id: string
          training_experience: Json | null
          training_preferences: Json | null
          updated_at: string
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          experience_level?: string | null
          fitness_goal?: string | null
          full_name?: string | null
          height?: number | null
          height_unit?: string | null
          id: string
          training_experience?: Json | null
          training_preferences?: Json | null
          updated_at?: string
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string
          experience_level?: string | null
          fitness_goal?: string | null
          full_name?: string | null
          height?: number | null
          height_unit?: string | null
          id?: string
          training_experience?: Json | null
          training_preferences?: Json | null
          updated_at?: string
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string
          duration: number
          end_time: string
          id: string
          is_historical: boolean | null
          logged_at: string | null
          metadata: Json | null
          name: string
          notes: string | null
          start_time: string
          training_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration: number
          end_time: string
          id?: string
          is_historical?: boolean | null
          logged_at?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          start_time: string
          training_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          end_time?: string
          id?: string
          is_historical?: boolean | null
          logged_at?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          start_time?: string
          training_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          estimated_duration: number | null
          exercises: Json
          id: string
          is_favorite: boolean | null
          name: string
          tags: string[] | null
          training_type: Database["public"]["Enums"]["training_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          estimated_duration?: number | null
          exercises: Json
          id?: string
          is_favorite?: boolean | null
          name: string
          tags?: string[] | null
          training_type: Database["public"]["Enums"]["training_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          estimated_duration?: number | null
          exercises?: Json
          id?: string
          is_favorite?: boolean | null
          name?: string
          tags?: string[] | null
          training_type?: Database["public"]["Enums"]["training_type"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      exercise_performance_summary: {
        Row: {
          avg_reps: number | null
          avg_weight: number | null
          exercise_name: string | null
          max_reps: number | null
          max_weight: number | null
          total_sets: number | null
          user_id: string | null
          workout_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_time_preferences: {
        Row: {
          avg_duration: number | null
          time_of_day: string | null
          user_id: string | null
          workout_count: number | null
        }
        Relationships: []
      }
      workout_type_distribution: {
        Row: {
          avg_duration: number | null
          last_workout_date: string | null
          total_duration: number | null
          training_type: string | null
          user_id: string | null
          workout_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_workout: {
        Args: { workout_id: string }
        Returns: undefined
      }
      increment_template_usage: {
        Args: { template_id: string }
        Returns: undefined
      }
      save_workout_transaction: {
        Args: { p_workout_data: Json; p_exercise_sets: Json }
        Returns: Json
      }
    }
    Enums: {
      task_priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      task_status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED"
      training_type:
        | "Strength"
        | "Hypertrophy"
        | "Cardio"
        | "Calisthenics"
        | "Stretching"
        | "Yoga"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      task_priority: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      task_status: ["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "ARCHIVED"],
      training_type: [
        "Strength",
        "Hypertrophy",
        "Cardio",
        "Calisthenics",
        "Stretching",
        "Yoga",
      ],
    },
  },
} as const
