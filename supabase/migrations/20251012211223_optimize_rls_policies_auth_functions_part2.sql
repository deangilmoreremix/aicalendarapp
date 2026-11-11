-- NOTE: every statement is guarded so this migration is a no-op for tables that do not exist in this database
-- (it was written for a larger schema; this app only has contacts, tasks, deals, activities, calendar_*).
/*
  # Optimize RLS Policies - Part 2 (User-Owned Resources)

  1. Purpose
    - Continue optimization of RLS policies for user-owned resources
    - Focuses on frequently accessed tables like funnels, templates, API keys

  2. Changes
    - Optimizes policies for image_assets, tool_execution_logs, cost_tracking
    - Optimizes policies for API keys, funnels, templates, campaigns
    - Uses subquery pattern for all auth function calls

  3. Performance Impact
    - Improves performance for user resource queries
    - Reduces database load for multi-user applications
*/

-- Image Assets policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own image assets" ON public.image_assets;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own image assets" ON public.image_assets
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert own image assets" ON public.image_assets;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert own image assets" ON public.image_assets
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update own image assets" ON public.image_assets;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update own image assets" ON public.image_assets
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can delete own image assets" ON public.image_assets;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can delete own image assets" ON public.image_assets
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Tool Execution Logs policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can read own tool execution logs" ON public.tool_execution_logs;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can read own tool execution logs" ON public.tool_execution_logs
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert own tool execution logs" ON public.tool_execution_logs;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert own tool execution logs" ON public.tool_execution_logs
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Cost Tracking policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can read own cost tracking" ON public.cost_tracking;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can read own cost tracking" ON public.cost_tracking
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert own cost tracking" ON public.cost_tracking;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert own cost tracking" ON public.cost_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Reasoning History policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can read own reasoning history" ON public.reasoning_history;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can read own reasoning history" ON public.reasoning_history
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert own reasoning history" ON public.reasoning_history;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert own reasoning history" ON public.reasoning_history
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Streaming Sessions policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can read own streaming sessions" ON public.streaming_sessions;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can read own streaming sessions" ON public.streaming_sessions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can manage own streaming sessions" ON public.streaming_sessions;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can manage own streaming sessions" ON public.streaming_sessions
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- API Keys policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view their own API keys" ON public.api_keys
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can create their own API keys" ON public.api_keys;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can create their own API keys" ON public.api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update their own API keys" ON public.api_keys
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can delete their own API keys" ON public.api_keys
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Funnels policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert their own funnels" ON public.funnels;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert their own funnels" ON public.funnels
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update their own funnels" ON public.funnels;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update their own funnels" ON public.funnels
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can delete their own funnels" ON public.funnels;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can delete their own funnels" ON public.funnels
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can manage their own funnels" ON public.funnels;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can manage their own funnels" ON public.funnels
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- User Templates policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view their own templates" ON public.user_templates;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view their own templates" ON public.user_templates
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.user_templates;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert their own templates" ON public.user_templates
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update their own templates" ON public.user_templates;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update their own templates" ON public.user_templates
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.user_templates;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can delete their own templates" ON public.user_templates
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- User Campaigns policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.user_campaigns;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view their own campaigns" ON public.user_campaigns
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.user_campaigns;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert their own campaigns" ON public.user_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.user_campaigns;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update their own campaigns" ON public.user_campaigns
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.user_campaigns;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can delete their own campaigns" ON public.user_campaigns
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- User Analytics policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view their own analytics data" ON public.user_analytics;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view their own analytics data" ON public.user_analytics
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert their own analytics data" ON public.user_analytics;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert their own analytics data" ON public.user_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update their own analytics data" ON public.user_analytics;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update their own analytics data" ON public.user_analytics
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
