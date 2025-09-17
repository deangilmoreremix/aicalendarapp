import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
          attachments: any[];
          subtasks: any[];
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
          attachments?: any[];
          subtasks?: any[];
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
          attachments?: any[];
          subtasks?: any[];
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
          metadata: Record<string, any> | null;
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
          metadata?: Record<string, any> | null;
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
          metadata?: Record<string, any> | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_ai_insights: {
        Args: { contacts: any[] };
        Returns: any[];
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
    };
    Enums: {
      [_ in never]: never;
    };
  };
}