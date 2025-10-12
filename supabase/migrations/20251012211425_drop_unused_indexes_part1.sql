/*
  # Drop Unused Indexes - Part 1

  1. Purpose
    - Remove indexes that are not being used by queries
    - Reduces storage overhead
    - Improves write/update performance

  2. Changes
    - Drops unused indexes on analytics, API, and AI-related tables
    - Uses IF EXISTS to prevent errors

  3. Performance Impact
    - Faster inserts and updates
    - Reduced storage usage
    - No negative impact on query performance (indexes weren't being used)
*/

-- Analytics and Time Series
DROP INDEX IF EXISTS public.analytics_time_series_date_value_idx;
DROP INDEX IF EXISTS public.analytics_time_series_metric_type_idx;
DROP INDEX IF EXISTS public.analytics_time_series_user_id_idx;

-- Analyzed Documents
DROP INDEX IF EXISTS public.analyzed_documents_user_id_idx;

-- API Access Logs
DROP INDEX IF EXISTS public.api_access_logs_accessed_at_idx;
DROP INDEX IF EXISTS public.api_access_logs_endpoint_idx;
DROP INDEX IF EXISTS public.api_access_logs_user_id_idx;

-- API Keys
DROP INDEX IF EXISTS public.api_keys_key_value_idx;
DROP INDEX IF EXISTS public.api_keys_user_id_idx;

-- Conversion Funnel
DROP INDEX IF EXISTS public.conversion_funnel_user_id_idx;

-- Dashboard Layouts
DROP INDEX IF EXISTS public.dashboard_layouts_user_id_idx;

-- Engagement Categories
DROP INDEX IF EXISTS public.engagement_categories_user_id_idx;

-- Generated Content
DROP INDEX IF EXISTS public.generated_content_user_id_idx;

-- Admin Audit Log
DROP INDEX IF EXISTS public.idx_admin_audit_log_admin_user_id;
DROP INDEX IF EXISTS public.idx_admin_audit_log_created_at;

-- Admin Users
DROP INDEX IF EXISTS public.idx_admin_users_email;
DROP INDEX IF EXISTS public.idx_admin_users_role;

-- Agent Coordination Events
DROP INDEX IF EXISTS public.idx_agent_coordination_events_agent_name;
DROP INDEX IF EXISTS public.idx_agent_coordination_events_task_id;
DROP INDEX IF EXISTS public.idx_agent_coordination_events_timestamp;

-- Agent Coordination Logs
DROP INDEX IF EXISTS public.idx_agent_coordination_logs_coordination_type;
DROP INDEX IF EXISTS public.idx_agent_coordination_logs_task_execution_id;

-- Agent Task Logs
DROP INDEX IF EXISTS public.idx_agent_task_logs_agent_name;
DROP INDEX IF EXISTS public.idx_agent_task_logs_execution_start;
DROP INDEX IF EXISTS public.idx_agent_task_logs_task_execution_id;

-- AI Context State
DROP INDEX IF EXISTS public.idx_ai_context_state_expires_at;
DROP INDEX IF EXISTS public.idx_ai_context_state_session_id;
DROP INDEX IF EXISTS public.idx_ai_context_state_user_id;

-- AI Execution History
DROP INDEX IF EXISTS public.idx_ai_execution_history_can_undo;
DROP INDEX IF EXISTS public.idx_ai_execution_history_created_at;
DROP INDEX IF EXISTS public.idx_ai_execution_history_entity_type_id;
DROP INDEX IF EXISTS public.idx_ai_execution_history_user_id;

-- AI Function Calls
DROP INDEX IF EXISTS public.idx_ai_function_calls_created_at;
DROP INDEX IF EXISTS public.idx_ai_function_calls_session_id;
DROP INDEX IF EXISTS public.idx_ai_function_calls_status;
DROP INDEX IF EXISTS public.idx_ai_function_calls_tenant_id;
DROP INDEX IF EXISTS public.idx_ai_function_calls_user_id;

-- AI Generations
DROP INDEX IF EXISTS public.idx_ai_generations_content_type;
DROP INDEX IF EXISTS public.idx_ai_generations_created_at;
DROP INDEX IF EXISTS public.idx_ai_generations_model;
DROP INDEX IF EXISTS public.idx_ai_generations_tenant_id;
DROP INDEX IF EXISTS public.idx_ai_generations_user_id;

-- AI Insights
DROP INDEX IF EXISTS public.idx_ai_insights_customer_id;
DROP INDEX IF EXISTS public.idx_ai_insights_enhanced_user_id;
DROP INDEX IF EXISTS public.idx_ai_insights_type;

-- AI Model Preferences
DROP INDEX IF EXISTS public.idx_ai_model_preferences_user_id;

-- AI Models
DROP INDEX IF EXISTS public.idx_ai_models_is_active;
DROP INDEX IF EXISTS public.idx_ai_models_is_recommended;

-- AI Pending Actions
DROP INDEX IF EXISTS public.idx_ai_pending_actions_expires_at;
DROP INDEX IF EXISTS public.idx_ai_pending_actions_status;
DROP INDEX IF EXISTS public.idx_ai_pending_actions_user_id;

-- AI Undo Snapshots
DROP INDEX IF EXISTS public.idx_ai_undo_snapshots_can_restore;
DROP INDEX IF EXISTS public.idx_ai_undo_snapshots_entity;
DROP INDEX IF EXISTS public.idx_ai_undo_snapshots_user_id;

-- AI Usage Logs
DROP INDEX IF EXISTS public.idx_ai_usage_logs_customer_id;
DROP INDEX IF EXISTS public.idx_ai_usage_logs_feature_used;
DROP INDEX IF EXISTS public.idx_ai_usage_logs_model_id;

-- AI User Permissions
DROP INDEX IF EXISTS public.idx_ai_user_permissions_user_id;

-- AI Workflows
DROP INDEX IF EXISTS public.idx_ai_workflows_session_id;
DROP INDEX IF EXISTS public.idx_ai_workflows_status;
DROP INDEX IF EXISTS public.idx_ai_workflows_user_id;
