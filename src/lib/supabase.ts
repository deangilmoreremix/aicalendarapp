import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// JSON-friendly type used for loosely-structured columns (attachments, subtasks, metadata).
type Json = Record<string, unknown>;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set. ' +
      'Set them in your Netlify site environment variables (or a local .env file) before building/deploying.'
  );
}

// Fall back to placeholder only so the app still boots in dev without crashing the module graph.
// Every network call will fail loudly at runtime if the real values are missing.
const resolvedUrl = supabaseUrl || 'https://your-project.supabase.co';
const resolvedKey = supabaseAnonKey || 'your-anon-key';

export const supabase: SupabaseClient = createClient(resolvedUrl, resolvedKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          name: string;
          email: string;
          phone: string | null;
          title: string;
          company: string;
          industry: string | null;
          avatar_src: string | null;
          avatar: string | null;
          sources: string[];
          interest_level: 'hot' | 'warm' | 'medium' | 'cold';
          status: 'lead' | 'prospect' | 'customer' | 'churned' | 'active' | 'pending' | 'inactive';
          tags: string[];
          notes: string | null;
          social_profiles: {
            linkedin?: string;
            twitter?: string;
            facebook?: string;
            instagram?: string;
            website?: string;
          };
          custom_fields: Record<string, string>;
          is_favorite: boolean;
          ai_score: number | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          name: string;
          email: string;
          phone?: string | null;
          title: string;
          company: string;
          industry?: string | null;
          avatar_src?: string | null;
          avatar?: string | null;
          sources?: string[];
          interest_level?: 'hot' | 'warm' | 'medium' | 'cold';
          status?: 'lead' | 'prospect' | 'customer' | 'churned' | 'active' | 'pending' | 'inactive';
          tags?: string[];
          notes?: string | null;
          social_profiles?: {
            linkedin?: string;
            twitter?: string;
            facebook?: string;
            instagram?: string;
            website?: string;
          };
          custom_fields?: Record<string, string>;
          is_favorite?: boolean;
          ai_score?: number | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          title?: string;
          company?: string;
          industry?: string | null;
          avatar_src?: string | null;
          avatar?: string | null;
          sources?: string[];
          interest_level?: 'hot' | 'warm' | 'medium' | 'cold';
          status?: 'lead' | 'prospect' | 'customer' | 'churned' | 'active' | 'pending' | 'inactive';
          tags?: string[];
          notes?: string | null;
          social_profiles?: {
            linkedin?: string;
            twitter?: string;
            facebook?: string;
            instagram?: string;
            website?: string;
          };
          custom_fields?: Record<string, string>;
          is_favorite?: boolean;
          ai_score?: number | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          status: 'pending' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled' | 'overdue';
          category: 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
          type: 'follow-up' | 'meeting' | 'call' | 'email' | 'proposal' | 'research' | 'administrative' | 'other';
          completed: boolean;
          created_at: string;
          completed_at: string | null;
          assigned_user_id: string | null;
          assigned_user_name: string | null;
          estimated_duration: number | null;
          actual_duration: number | null;
          tags: string[];
          attachments: Json[];
          subtasks: Json[];
          related_to: {
            type: 'contact' | 'deal' | 'project';
            id: string;
            name: string;
          } | null;
          notes: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'pending' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled' | 'overdue';
          category?: 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
          type?: 'follow-up' | 'meeting' | 'call' | 'email' | 'proposal' | 'research' | 'administrative' | 'other';
          completed?: boolean;
          created_at?: string;
          completed_at?: string | null;
          assigned_user_id?: string | null;
          assigned_user_name?: string | null;
          estimated_duration?: number | null;
          actual_duration?: number | null;
          tags?: string[];
          attachments?: Json[];
          subtasks?: Json[];
          related_to?: {
            type: 'contact' | 'deal' | 'project';
            id: string;
            name: string;
          } | null;
          notes?: string | null;
          user_id?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'pending' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled' | 'overdue';
          category?: 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
          type?: 'follow-up' | 'meeting' | 'call' | 'email' | 'proposal' | 'research' | 'administrative' | 'other';
          completed?: boolean;
          created_at?: string;
          completed_at?: string | null;
          assigned_user_id?: string | null;
          assigned_user_name?: string | null;
          estimated_duration?: number | null;
          actual_duration?: number | null;
          tags?: string[];
          attachments?: Json[];
          subtasks?: Json[];
          related_to?: {
            type: 'contact' | 'deal' | 'project';
            id: string;
            name: string;
          } | null;
          notes?: string | null;
          user_id?: string;
        };
      };
      deals: {
        Row: {
          id: string;
          company: string;
          value: string;
          probability: string;
          due_date: string;
          contact_id: string;
          status: 'online' | 'offline';
          stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
          priority: 'low' | 'medium' | 'high';
          ai_prediction: number | null;
          description: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          company: string;
          value: string;
          probability?: string;
          due_date: string;
          contact_id: string;
          status?: 'online' | 'offline';
          stage?: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
          priority?: 'low' | 'medium' | 'high';
          ai_prediction?: number | null;
          description?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          id?: string;
          company?: string;
          value?: string;
          probability?: string;
          due_date?: string;
          contact_id?: string;
          status?: 'online' | 'offline';
          stage?: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
          priority?: 'low' | 'medium' | 'high';
          ai_prediction?: number | null;
          description?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          type: string;
          title: string;
          description: string | null;
          user_id: string;
          user_name: string;
          entity_type: 'task' | 'deal' | 'contact' | 'calendar';
          entity_id: string;
          created_at: string;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          description?: string | null;
          user_id: string;
          user_name: string;
          entity_type: 'task' | 'deal' | 'contact' | 'calendar';
          entity_id: string;
          created_at?: string;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          type?: string;
          title?: string;
          description?: string | null;
          user_id?: string;
          user_name?: string;
          entity_type?: 'task' | 'deal' | 'contact' | 'calendar';
          entity_id?: string;
          created_at?: string;
          metadata?: Record<string, unknown> | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_ai_insights: {
        Args: { contacts: Record<string, unknown>[] };
        Returns: Record<string, unknown>[];
      };
      predict_deal_success: {
        Args: { contact_id: string; deal_value: number };
        Returns: number;
      };
      optimize_meeting_time: {
        Args: { attendee_ids: string[]; duration: number };
        Returns: string[];
      };
      generate_meeting_agenda: {
        Args: { title: string; attendees: string[] };
        Returns: string[];
      };
      generate_task_suggestions: {
        Args: { prompt: string; context?: Record<string, unknown>; stream?: boolean };
        Returns: Record<string, unknown>[];
      };
      generate_deal_suggestions: {
        Args: { contact_id?: string; deal_value?: number };
        Returns: Record<string, unknown>[];
      };
      contacts_enrich: {
        Args: { contact: Record<string, unknown> };
        Returns: { text: string };
      };
      email_compose: {
        Args: { recipient: Record<string, unknown>; context: string };
        Returns: { text: string };
      };
      meetings_plan: {
        Args: { attendees: string[]; duration: number; topic: string };
        Returns: { text: string };
      };
      research_web: {
        Args: { query: string; depth?: string; includeCitations?: boolean };
        Returns: { text: string };
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}