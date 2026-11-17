-- NOTE: every statement is guarded so this migration is a no-op for tables that do not exist in this database
-- (it was written for a larger schema; this app only has contacts, tasks, deals, activities, calendar_*).
/*
  # Optimize RLS Policies - Part 4 Fixed (Funnel & Analytics)

  1. Purpose
    - Optimize funnel-related RLS policies (excluding tables without user_id)
    - Fix analytics and tracking policies
    - Optimize AI insights and suggestions policies

  2. Changes
    - Optimizes funnel views, sessions, conversions policies
    - Optimizes proactive suggestions and goal recommendations
    - Optimizes AI insights policies
    - Skips tables without direct user_id column

  3. Performance Impact
    - Improves funnel analytics dashboard performance
    - Better performance for AI-powered features
    - Optimized tracking queries
*/

-- Funnel Views policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own funnel analytics" ON public.funnel_views;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own funnel analytics" ON public.funnel_views
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Funnel Sessions policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own session data" ON public.funnel_sessions;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own session data" ON public.funnel_sessions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Funnel Conversions policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own conversion data" ON public.funnel_conversions;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own conversion data" ON public.funnel_conversions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Funnel Responses policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view responses from their funnels" ON public.funnel_responses;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view responses from their funnels" ON public.funnel_responses
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update responses from their funnels" ON public.funnel_responses;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update responses from their funnels" ON public.funnel_responses
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can delete responses from their funnels" ON public.funnel_responses;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can delete responses from their funnels" ON public.funnel_responses
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- AI Insights Enhanced policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can access their own AI insights" ON public.ai_insights_enhanced;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can access their own AI insights" ON public.ai_insights_enhanced
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Proactive Suggestions policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can access their own suggestions" ON public.proactive_suggestions;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can access their own suggestions" ON public.proactive_suggestions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Personalized Goal Recommendations policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can access their own goal recommendations" ON public.personalized_goal_recommendations;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can access their own goal recommendations" ON public.personalized_goal_recommendations
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Conversation Messages policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can access messages in their contexts" ON public.conversation_messages;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can access messages in their contexts" ON public.conversation_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_contexts cc
      WHERE cc.id = conversation_messages.context_id
      AND cc.user_id = (select auth.uid())
    )
  );
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Conversation Contexts policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can manage their own conversation contexts" ON public.conversation_contexts;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can manage their own conversation contexts" ON public.conversation_contexts
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Message Logs policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view their own message logs" ON public.message_logs;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view their own message logs" ON public.message_logs
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert their own message logs" ON public.message_logs;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert their own message logs" ON public.message_logs
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Conversion Funnel policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view their own conversion funnel" ON public.conversion_funnel;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view their own conversion funnel" ON public.conversion_funnel
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert their own conversion funnel" ON public.conversion_funnel;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert their own conversion funnel" ON public.conversion_funnel
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update their own conversion funnel" ON public.conversion_funnel;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update their own conversion funnel" ON public.conversion_funnel
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Engagement Categories policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view their own engagement categories" ON public.engagement_categories;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view their own engagement categories" ON public.engagement_categories
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert their own engagement categories" ON public.engagement_categories;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert their own engagement categories" ON public.engagement_categories
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update their own engagement categories" ON public.engagement_categories;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update their own engagement categories" ON public.engagement_categories
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Analytics Time Series policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view their own time series data" ON public.analytics_time_series;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view their own time series data" ON public.analytics_time_series
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert their own time series data" ON public.analytics_time_series;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert their own time series data" ON public.analytics_time_series
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- API Access Logs policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view their own API access logs" ON public.api_access_logs;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view their own API access logs" ON public.api_access_logs
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Response Activities policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view activities for their responses" ON public.response_activities;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view activities for their responses" ON public.response_activities
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
