/*
  # Add Missing Foreign Key Indexes

  1. Purpose
    - Add indexes to foreign key columns that are missing them
    - Improves query performance for JOIN operations
    - Resolves unindexed foreign key warnings

  2. Changes
    - Creates indexes on all foreign key columns across multiple tables
    - Uses IF NOT EXISTS to prevent errors on re-run
    - Indexes are named consistently: idx_<table>_<column>

  3. Performance Impact
    - Significantly improves JOIN query performance
    - Speeds up foreign key constraint checks
    - Minimal impact on write operations
*/

-- ai_context_state foreign key indexes
CREATE INDEX IF NOT EXISTS idx_ai_context_state_current_funnel_id ON public.ai_context_state(current_funnel_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_state_tenant_id_fk ON public.ai_context_state(tenant_id);

-- ai_execution_history foreign key indexes
CREATE INDEX IF NOT EXISTS idx_ai_execution_history_function_call_id ON public.ai_execution_history(function_call_id);
CREATE INDEX IF NOT EXISTS idx_ai_execution_history_tenant_id_fk ON public.ai_execution_history(tenant_id);

-- ai_pending_actions foreign key indexes
CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_function_call_id ON public.ai_pending_actions(function_call_id);
CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_tenant_id_fk ON public.ai_pending_actions(tenant_id);

-- ai_undo_snapshots foreign key indexes
CREATE INDEX IF NOT EXISTS idx_ai_undo_snapshots_execution_history_id ON public.ai_undo_snapshots(execution_history_id);
CREATE INDEX IF NOT EXISTS idx_ai_undo_snapshots_tenant_id_fk ON public.ai_undo_snapshots(tenant_id);

-- ai_user_permissions foreign key indexes
CREATE INDEX IF NOT EXISTS idx_ai_user_permissions_tenant_id_fk ON public.ai_user_permissions(tenant_id);

-- ai_workflows foreign key indexes
CREATE INDEX IF NOT EXISTS idx_ai_workflows_tenant_id_fk ON public.ai_workflows(tenant_id);

-- api_access_logs foreign key indexes
CREATE INDEX IF NOT EXISTS idx_api_access_logs_api_key_id ON public.api_access_logs(api_key_id);

-- api_usage foreign key indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON public.api_usage(user_id);

-- app_settings foreign key indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON public.app_settings(user_id);

-- appointments foreign key indexes
CREATE INDEX IF NOT EXISTS idx_appointments_deal_id ON public.appointments(deal_id);

-- assistant_reports foreign key indexes
CREATE INDEX IF NOT EXISTS idx_assistant_reports_user_id ON public.assistant_reports(user_id);

-- communication_templates foreign key indexes
CREATE INDEX IF NOT EXISTS idx_communication_templates_customer_id ON public.communication_templates(customer_id);

-- contact_segments foreign key indexes
CREATE INDEX IF NOT EXISTS idx_contact_segments_customer_id ON public.contact_segments(customer_id);

-- content_templates foreign key indexes
CREATE INDEX IF NOT EXISTS idx_content_templates_user_id ON public.content_templates(user_id);

-- conversation_context_cache foreign key indexes
CREATE INDEX IF NOT EXISTS idx_conversation_context_cache_user_id ON public.conversation_context_cache(user_id);

-- cost_tracking foreign key indexes
CREATE INDEX IF NOT EXISTS idx_cost_tracking_generation_id ON public.cost_tracking(generation_id);

-- entitlements foreign key indexes
CREATE INDEX IF NOT EXISTS idx_entitlements_product_name ON public.entitlements(product_name);
CREATE INDEX IF NOT EXISTS idx_entitlements_source_purchase_id ON public.entitlements(source_purchase_id);

-- funnel_conversions foreign key indexes
CREATE INDEX IF NOT EXISTS idx_funnel_conversions_user_id ON public.funnel_conversions(user_id);

-- funnel_responses foreign key indexes
CREATE INDEX IF NOT EXISTS idx_funnel_responses_user_id ON public.funnel_responses(user_id);

-- funnel_sessions foreign key indexes
CREATE INDEX IF NOT EXISTS idx_funnel_sessions_user_id ON public.funnel_sessions(user_id);

-- funnel_views foreign key indexes
CREATE INDEX IF NOT EXISTS idx_funnel_views_user_id ON public.funnel_views(user_id);

-- generated_content foreign key indexes
CREATE INDEX IF NOT EXISTS idx_generated_content_content_type_id ON public.generated_content(content_type_id);

-- generated_images foreign key indexes
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON public.generated_images(user_id);

-- generated_videos foreign key indexes
CREATE INDEX IF NOT EXISTS idx_generated_videos_image_id ON public.generated_videos(image_id);
CREATE INDEX IF NOT EXISTS idx_generated_videos_user_id ON public.generated_videos(user_id);

-- openai_embeddings foreign key indexes
CREATE INDEX IF NOT EXISTS idx_openai_embeddings_user_id ON public.openai_embeddings(user_id);

-- partner_applications foreign key indexes
CREATE INDEX IF NOT EXISTS idx_partner_applications_partner_id ON public.partner_applications(partner_id);

-- partner_customers foreign key indexes
CREATE INDEX IF NOT EXISTS idx_partner_customers_tenant_id ON public.partner_customers(tenant_id);

-- pending_entitlements foreign key indexes
CREATE INDEX IF NOT EXISTS idx_pending_entitlements_claimed_by ON public.pending_entitlements(claimed_by);
CREATE INDEX IF NOT EXISTS idx_pending_entitlements_purchase_event_id ON public.pending_entitlements(purchase_event_id);

-- project_images foreign key indexes
CREATE INDEX IF NOT EXISTS idx_project_images_image_id ON public.project_images(image_id);
CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON public.project_images(project_id);

-- purchases foreign key indexes
CREATE INDEX IF NOT EXISTS idx_purchases_product_name ON public.purchases(product_name);

-- reasoning_history foreign key indexes
CREATE INDEX IF NOT EXISTS idx_reasoning_history_user_id ON public.reasoning_history(user_id);

-- reference_images foreign key indexes
CREATE INDEX IF NOT EXISTS idx_reference_images_user_id ON public.reference_images(user_id);

-- response_activities foreign key indexes
CREATE INDEX IF NOT EXISTS idx_response_activities_user_id ON public.response_activities(user_id);

-- sales_activities foreign key indexes
CREATE INDEX IF NOT EXISTS idx_sales_activities_appointment_id ON public.sales_activities(appointment_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_communication_id ON public.sales_activities(communication_id);

-- sales_goals foreign key indexes
CREATE INDEX IF NOT EXISTS idx_sales_goals_customer_id ON public.sales_goals(customer_id);

-- sales_sequences foreign key indexes
CREATE INDEX IF NOT EXISTS idx_sales_sequences_customer_id ON public.sales_sequences(customer_id);

-- streaming_sessions foreign key indexes
CREATE INDEX IF NOT EXISTS idx_streaming_sessions_user_id ON public.streaming_sessions(user_id);

-- stripe_payment_methods foreign key indexes
CREATE INDEX IF NOT EXISTS idx_stripe_payment_methods_customer_id ON public.stripe_payment_methods(customer_id);

-- stripe_prices foreign key indexes
CREATE INDEX IF NOT EXISTS idx_stripe_prices_product ON public.stripe_prices(product);

-- sync_jobs foreign key indexes
CREATE INDEX IF NOT EXISTS idx_sync_jobs_started_by ON public.sync_jobs(started_by);

-- template_categories foreign key indexes
CREATE INDEX IF NOT EXISTS idx_template_categories_parent_id ON public.template_categories(parent_id);

-- tool_execution_logs foreign key indexes
CREATE INDEX IF NOT EXISTS idx_tool_execution_logs_user_id ON public.tool_execution_logs(user_id);

-- user_fonts foreign key indexes
CREATE INDEX IF NOT EXISTS idx_user_fonts_user_id ON public.user_fonts(user_id);

-- user_projects foreign key indexes
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON public.user_projects(user_id);

-- video_sharing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_video_sharing_recipient_id ON public.video_sharing(recipient_id);

-- web_search_results foreign key indexes
CREATE INDEX IF NOT EXISTS idx_web_search_results_message_id ON public.web_search_results(message_id);
