/*
  # Drop Unused Indexes - Part 4 (Final)

  1. Purpose
    - Complete removal of unused indexes
    - Focus on remaining tables: products, purchases, sales, tasks, users, videos

  2. Changes
    - Drops final set of unused indexes
    - Uses IF EXISTS to prevent errors

  3. Performance Impact
    - Completes optimization of write performance
    - Final reduction in storage overhead
*/

-- Product Analyses
DROP INDEX IF EXISTS public.idx_product_analyses_created_at;
DROP INDEX IF EXISTS public.idx_product_analyses_crm_account_id;
DROP INDEX IF EXISTS public.idx_product_analyses_embedding;
DROP INDEX IF EXISTS public.idx_product_analyses_image_url;
DROP INDEX IF EXISTS public.idx_product_analyses_user_id;

-- Purchase Events
DROP INDEX IF EXISTS public.idx_purchase_events_created_at;
DROP INDEX IF EXISTS public.idx_purchase_events_email;
DROP INDEX IF EXISTS public.idx_purchase_events_status;

-- Purchases
DROP INDEX IF EXISTS public.idx_purchases_stripe_customer_id;
DROP INDEX IF EXISTS public.idx_purchases_stripe_payment_intent_id;

-- Reasoning History
DROP INDEX IF EXISTS public.idx_reasoning_history_generation;

-- Response Activities
DROP INDEX IF EXISTS public.idx_response_activities_created_at;
DROP INDEX IF EXISTS public.idx_response_activities_response_id;

-- Sales Activities
DROP INDEX IF EXISTS public.idx_sales_activities_assigned_to;
DROP INDEX IF EXISTS public.idx_sales_activities_contact_id;
DROP INDEX IF EXISTS public.idx_sales_activities_customer_id;
DROP INDEX IF EXISTS public.idx_sales_activities_deal_id;
DROP INDEX IF EXISTS public.idx_sales_activities_due_date;

-- Stripe tables
DROP INDEX IF EXISTS public.idx_stripe_charges_created;
DROP INDEX IF EXISTS public.idx_stripe_charges_customer;
DROP INDEX IF EXISTS public.idx_stripe_checkout_sessions_customer;
DROP INDEX IF EXISTS public.idx_stripe_customers_created;
DROP INDEX IF EXISTS public.idx_stripe_customers_email;
DROP INDEX IF EXISTS public.idx_stripe_entitlements_active;
DROP INDEX IF EXISTS public.idx_stripe_entitlements_customer_id;
DROP INDEX IF EXISTS public.idx_stripe_entitlements_user_id;
DROP INDEX IF EXISTS public.idx_stripe_invoices_customer;
DROP INDEX IF EXISTS public.idx_stripe_subscriptions_customer;

-- Sync Jobs
DROP INDEX IF EXISTS public.idx_sync_jobs_status;
DROP INDEX IF EXISTS public.idx_sync_jobs_type;

-- Task Business Outcomes
DROP INDEX IF EXISTS public.idx_task_business_outcomes_task_id;
DROP INDEX IF EXISTS public.idx_task_business_outcomes_type;
DROP INDEX IF EXISTS public.idx_task_business_outcomes_value;

-- Task Executions
DROP INDEX IF EXISTS public.idx_task_executions_created_at;
DROP INDEX IF EXISTS public.idx_task_executions_customer_id;
DROP INDEX IF EXISTS public.idx_task_executions_status;
DROP INDEX IF EXISTS public.idx_task_executions_task_type;

-- Task Templates
DROP INDEX IF EXISTS public.idx_task_templates_customer_id;
DROP INDEX IF EXISTS public.idx_task_templates_is_active;
DROP INDEX IF EXISTS public.idx_task_templates_task_type;

-- Tasks
DROP INDEX IF EXISTS public.idx_tasks_completed;
DROP INDEX IF EXISTS public.idx_tasks_created_at;
DROP INDEX IF EXISTS public.idx_tasks_due_date;
DROP INDEX IF EXISTS public.idx_tasks_priority;
DROP INDEX IF EXISTS public.idx_tasks_related_to;

-- Template Ratings
DROP INDEX IF EXISTS public.idx_template_ratings_template;
DROP INDEX IF EXISTS public.idx_template_ratings_user;

-- Template Steps
DROP INDEX IF EXISTS public.idx_template_steps_position;
DROP INDEX IF EXISTS public.idx_template_steps_template_id;

-- Tenants
DROP INDEX IF EXISTS public.idx_tenants_custom_domain;
DROP INDEX IF EXISTS public.idx_tenants_subdomain;

-- Tool Execution
DROP INDEX IF EXISTS public.idx_tool_execution_generation;

-- Usage Logs
DROP INDEX IF EXISTS public.idx_usage_logs_user_created;
DROP INDEX IF EXISTS public.usage_logs_action_idx;
DROP INDEX IF EXISTS public.usage_logs_created_at_idx;
DROP INDEX IF EXISTS public.usage_logs_user_id_idx;

-- User Business Profiles
DROP INDEX IF EXISTS public.idx_user_business_profiles_user_id;

-- User Campaigns
DROP INDEX IF EXISTS public.idx_user_campaigns_user_id;

-- User Entitlements
DROP INDEX IF EXISTS public.idx_user_entitlements_expires_at;
DROP INDEX IF EXISTS public.idx_user_entitlements_product_sku;
DROP INDEX IF EXISTS public.idx_user_entitlements_status;
DROP INDEX IF EXISTS public.idx_user_entitlements_user_id;

-- User Identities
DROP INDEX IF EXISTS public.idx_user_identities_clerk_user_id;
DROP INDEX IF EXISTS public.idx_user_identities_customer_id;

-- User Template Favorites
DROP INDEX IF EXISTS public.idx_user_template_favorites_template;
DROP INDEX IF EXISTS public.idx_user_template_favorites_user;

-- User Templates
DROP INDEX IF EXISTS public.idx_user_templates_type;
DROP INDEX IF EXISTS public.idx_user_templates_user_id;

-- User Tenant Roles
DROP INDEX IF EXISTS public.idx_user_tenant_roles_tenant_id;
DROP INDEX IF EXISTS public.idx_user_tenant_roles_user_id;

-- Videos
DROP INDEX IF EXISTS public.idx_videos_app_id;
DROP INDEX IF EXISTS public.idx_videos_created_at;
DROP INDEX IF EXISTS public.idx_videos_status;
DROP INDEX IF EXISTS public.idx_videos_user_id;

-- Webhook Deliveries
DROP INDEX IF EXISTS public.idx_webhook_deliveries_created_at;
DROP INDEX IF EXISTS public.idx_webhook_deliveries_event_type;
DROP INDEX IF EXISTS public.idx_webhook_deliveries_status;
DROP INDEX IF EXISTS public.idx_webhook_deliveries_tenant_id;

-- White Label Configs
DROP INDEX IF EXISTS public.idx_white_label_configs_tenant;

-- Workflow Executions
DROP INDEX IF EXISTS public.idx_workflow_executions_customer_id;
DROP INDEX IF EXISTS public.idx_workflow_executions_status;
DROP INDEX IF EXISTS public.idx_workflow_executions_workflow_id;

-- LinkedIn and other user tables
DROP INDEX IF EXISTS public.linkedin_profiles_user_id_idx;
DROP INDEX IF EXISTS public.storage_usage_user_id_idx;
DROP INDEX IF EXISTS public.user_analytics_date_recorded_idx;
DROP INDEX IF EXISTS public.user_analytics_metric_type_idx;
DROP INDEX IF EXISTS public.user_analytics_user_id_idx;
DROP INDEX IF EXISTS public.user_upload_logs_user_id_idx;
DROP INDEX IF EXISTS public.video_analytics_user_id_idx;
DROP INDEX IF EXISTS public.video_analytics_video_id_idx;
DROP INDEX IF EXISTS public.video_sharing_owner_id_idx;
DROP INDEX IF EXISTS public.video_sharing_video_id_idx;
