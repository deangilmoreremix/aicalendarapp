/*
  # Drop Unused Indexes - Part 2

  1. Purpose
    - Continue removing unused indexes
    - Focus on app, appointment, and business-related tables

  2. Changes
    - Drops unused indexes on app, appointment, automation, business, campaign tables
    - Uses IF EXISTS to prevent errors

  3. Performance Impact
    - Faster writes and updates
    - Reduced storage overhead
*/

-- App Access
DROP INDEX IF EXISTS public.idx_app_access_app_id;
DROP INDEX IF EXISTS public.idx_app_access_customer_id;
DROP INDEX IF EXISTS public.idx_app_access_is_active;

-- App Content
DROP INDEX IF EXISTS public.idx_app_content_created_at;
DROP INDEX IF EXISTS public.idx_app_content_user_id;

-- App Content Metadata
DROP INDEX IF EXISTS public.idx_app_content_metadata_content_type;
DROP INDEX IF EXISTS public.idx_app_content_metadata_created_at;
DROP INDEX IF EXISTS public.idx_app_content_metadata_customer_id;
DROP INDEX IF EXISTS public.idx_app_content_metadata_uploaded_by;

-- App Features
DROP INDEX IF EXISTS public.idx_app_features_app_id;
DROP INDEX IF EXISTS public.idx_app_features_app_slug;
DROP INDEX IF EXISTS public.idx_app_features_feature_id;

-- App Sync History
DROP INDEX IF EXISTS public.idx_app_sync_history_app_id;
DROP INDEX IF EXISTS public.idx_app_sync_history_customer_id;
DROP INDEX IF EXISTS public.idx_app_sync_history_synced_at;

-- App Users
DROP INDEX IF EXISTS public.idx_app_users_email;
DROP INDEX IF EXISTS public.idx_app_users_first_name;
DROP INDEX IF EXISTS public.idx_app_users_last_name;

-- Appointments
DROP INDEX IF EXISTS public.idx_appointments_assigned_to;
DROP INDEX IF EXISTS public.idx_appointments_contact_id;
DROP INDEX IF EXISTS public.idx_appointments_customer_id;
DROP INDEX IF EXISTS public.idx_appointments_start_time;
DROP INDEX IF EXISTS public.idx_appointments_status;

-- Apps
DROP INDEX IF EXISTS public.idx_apps_category;
DROP INDEX IF EXISTS public.idx_apps_is_active;
DROP INDEX IF EXISTS public.idx_apps_slug;

-- Automation Rules
DROP INDEX IF EXISTS public.idx_automation_rules_customer_id;
DROP INDEX IF EXISTS public.idx_automation_rules_status;
DROP INDEX IF EXISTS public.idx_automation_rules_type;

-- Business Analyzer
DROP INDEX IF EXISTS public.idx_business_analyzer_created_at;
DROP INDEX IF EXISTS public.idx_business_analyzer_status;
DROP INDEX IF EXISTS public.idx_business_analyzer_user_id;

-- Campaigns
DROP INDEX IF EXISTS public.idx_campaigns_user_status;

-- Communication Logs
DROP INDEX IF EXISTS public.idx_communication_logs_user_sent;

-- Communications
DROP INDEX IF EXISTS public.idx_communications_contact_id;
DROP INDEX IF EXISTS public.idx_communications_created_at;
DROP INDEX IF EXISTS public.idx_communications_customer_id;
DROP INDEX IF EXISTS public.idx_communications_deal_id;
DROP INDEX IF EXISTS public.idx_communications_type;

-- Contacts
DROP INDEX IF EXISTS public.idx_contacts_ai_score;
DROP INDEX IF EXISTS public.idx_contacts_company;
DROP INDEX IF EXISTS public.idx_contacts_company_lookup;
DROP INDEX IF EXISTS public.idx_contacts_created_at;
DROP INDEX IF EXISTS public.idx_contacts_email;
DROP INDEX IF EXISTS public.idx_contacts_email_lookup;
DROP INDEX IF EXISTS public.idx_contacts_gamification_points;
DROP INDEX IF EXISTS public.idx_contacts_is_team_member;
DROP INDEX IF EXISTS public.idx_contacts_last_activity;
DROP INDEX IF EXISTS public.idx_contacts_lead_score;
DROP INDEX IF EXISTS public.idx_contacts_role;
DROP INDEX IF EXISTS public.idx_contacts_source;
DROP INDEX IF EXISTS public.idx_contacts_status;

-- Content Types
DROP INDEX IF EXISTS public.idx_content_types_category;

-- Conversation Cache
DROP INDEX IF EXISTS public.idx_conversation_cache_expires;
DROP INDEX IF EXISTS public.idx_conversation_cache_key;

-- Conversation Contexts
DROP INDEX IF EXISTS public.idx_conversation_contexts_session_id;
DROP INDEX IF EXISTS public.idx_conversation_contexts_user_id;

-- Conversation Messages
DROP INDEX IF EXISTS public.idx_conversation_messages_context_id;
DROP INDEX IF EXISTS public.idx_conversation_messages_created_at;
DROP INDEX IF EXISTS public.idx_conversation_messages_embedding;

-- Cost Tracking
DROP INDEX IF EXISTS public.idx_cost_tracking_model;
DROP INDEX IF EXISTS public.idx_cost_tracking_tenant;
DROP INDEX IF EXISTS public.idx_cost_tracking_user;

-- Customers
DROP INDEX IF EXISTS public.idx_customers_created_at;
DROP INDEX IF EXISTS public.idx_customers_email;
DROP INDEX IF EXISTS public.idx_customers_plan;
DROP INDEX IF EXISTS public.idx_customers_status;
DROP INDEX IF EXISTS public.idx_customers_subdomain;
