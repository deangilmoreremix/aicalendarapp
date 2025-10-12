/*
  # Drop Unused Indexes - Part 3

  1. Purpose
    - Continue removing unused indexes
    - Focus on deals, funnels, features, and templates

  2. Changes
    - Drops unused indexes on deals, enhanced tasks, features, funnels, templates
    - Uses IF EXISTS to prevent errors

  3. Performance Impact
    - Faster writes on frequently updated tables
    - Reduced index maintenance overhead
*/

-- Deals
DROP INDEX IF EXISTS public.idx_deals_assigned_to;
DROP INDEX IF EXISTS public.idx_deals_contact_id;
DROP INDEX IF EXISTS public.idx_deals_contact_lookup;
DROP INDEX IF EXISTS public.idx_deals_customer_id;
DROP INDEX IF EXISTS public.idx_deals_customer_lookup;
DROP INDEX IF EXISTS public.idx_deals_expected_close_date;
DROP INDEX IF EXISTS public.idx_deals_stage_id;
DROP INDEX IF EXISTS public.idx_deals_status;

-- Enhanced Task Executions
DROP INDEX IF EXISTS public.idx_enhanced_task_executions_created_at;
DROP INDEX IF EXISTS public.idx_enhanced_task_executions_customer_id;
DROP INDEX IF EXISTS public.idx_enhanced_task_executions_priority;
DROP INDEX IF EXISTS public.idx_enhanced_task_executions_status;
DROP INDEX IF EXISTS public.idx_enhanced_task_executions_task_type;

-- Enhanced Task Templates
DROP INDEX IF EXISTS public.idx_enhanced_task_templates_active;
DROP INDEX IF EXISTS public.idx_enhanced_task_templates_customer_id;
DROP INDEX IF EXISTS public.idx_enhanced_task_templates_usage;

-- Features
DROP INDEX IF EXISTS public.idx_features_app_slug;
DROP INDEX IF EXISTS public.idx_features_is_enabled;
DROP INDEX IF EXISTS public.idx_features_slug;

-- Funnel Conversions
DROP INDEX IF EXISTS public.idx_funnel_conversions_created_at;
DROP INDEX IF EXISTS public.idx_funnel_conversions_funnel_id;
DROP INDEX IF EXISTS public.idx_funnel_conversions_session_id;

-- Funnel Interactions
DROP INDEX IF EXISTS public.idx_funnel_interactions_created_at;
DROP INDEX IF EXISTS public.idx_funnel_interactions_funnel_id;
DROP INDEX IF EXISTS public.idx_funnel_interactions_session_id;

-- Funnel Metrics Daily
DROP INDEX IF EXISTS public.idx_funnel_metrics_daily_date;
DROP INDEX IF EXISTS public.idx_funnel_metrics_daily_funnel_id;

-- Funnel Responses
DROP INDEX IF EXISTS public.idx_funnel_responses_created_at;
DROP INDEX IF EXISTS public.idx_funnel_responses_email;
DROP INDEX IF EXISTS public.idx_funnel_responses_funnel_email;
DROP INDEX IF EXISTS public.idx_funnel_responses_funnel_id;
DROP INDEX IF EXISTS public.idx_funnel_responses_session_id;
DROP INDEX IF EXISTS public.idx_funnel_responses_status;
DROP INDEX IF EXISTS public.idx_funnel_responses_visitor_id;

-- Funnel Sessions
DROP INDEX IF EXISTS public.idx_funnel_sessions_funnel_id;
DROP INDEX IF EXISTS public.idx_funnel_sessions_session_id;
DROP INDEX IF EXISTS public.idx_funnel_sessions_visitor_id;

-- Funnel Steps
DROP INDEX IF EXISTS public.idx_funnel_steps_funnel_id;
DROP INDEX IF EXISTS public.idx_funnel_steps_position;

-- Funnel Templates
DROP INDEX IF EXISTS public.idx_funnel_templates_category;
DROP INDEX IF EXISTS public.idx_funnel_templates_created_by;
DROP INDEX IF EXISTS public.idx_funnel_templates_is_featured;
DROP INDEX IF EXISTS public.idx_funnel_templates_is_public;
DROP INDEX IF EXISTS public.idx_funnel_templates_rating;
DROP INDEX IF EXISTS public.idx_funnel_templates_tags;
DROP INDEX IF EXISTS public.idx_funnel_templates_use_count;

-- Funnel Views
DROP INDEX IF EXISTS public.idx_funnel_views_created_at;
DROP INDEX IF EXISTS public.idx_funnel_views_funnel_id;
DROP INDEX IF EXISTS public.idx_funnel_views_session_id;
DROP INDEX IF EXISTS public.idx_funnel_views_visitor_id;

-- Funnels
DROP INDEX IF EXISTS public.idx_funnels_tenant_id;
DROP INDEX IF EXISTS public.idx_funnels_user_id;

-- Generated Content
DROP INDEX IF EXISTS public.idx_generated_content_user_created;

-- Image Assets
DROP INDEX IF EXISTS public.idx_image_assets_created_at;
DROP INDEX IF EXISTS public.idx_image_assets_source;
DROP INDEX IF EXISTS public.idx_image_assets_tenant_id;
DROP INDEX IF EXISTS public.idx_image_assets_user_id;

-- Import Logs
DROP INDEX IF EXISTS public.idx_import_logs_created_at;
DROP INDEX IF EXISTS public.idx_import_logs_entity_type;
DROP INDEX IF EXISTS public.idx_import_logs_user_id;

-- Message Logs
DROP INDEX IF EXISTS public.idx_message_logs_channel;
DROP INDEX IF EXISTS public.idx_message_logs_sent_at;
DROP INDEX IF EXISTS public.idx_message_logs_user_id;

-- Partner Customers
DROP INDEX IF EXISTS public.idx_partner_customers_partner;

-- Partner Stats
DROP INDEX IF EXISTS public.idx_partner_stats_partner;

-- Partners
DROP INDEX IF EXISTS public.idx_partners_status;
DROP INDEX IF EXISTS public.idx_partners_subdomain;

-- Pending Entitlements
DROP INDEX IF EXISTS public.idx_pending_entitlements_email;
DROP INDEX IF EXISTS public.idx_pending_entitlements_status;

-- Personalized Goal Recommendations
DROP INDEX IF EXISTS public.idx_personalized_goal_recommendations_relevance;
DROP INDEX IF EXISTS public.idx_personalized_goal_recommendations_user_id;

-- Proactive Suggestions
DROP INDEX IF EXISTS public.idx_proactive_suggestions_priority;
DROP INDEX IF EXISTS public.idx_proactive_suggestions_status;
DROP INDEX IF EXISTS public.idx_proactive_suggestions_user_id;
