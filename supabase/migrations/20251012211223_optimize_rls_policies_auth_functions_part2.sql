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
DROP POLICY IF EXISTS "Users can view own image assets" ON public.image_assets;
CREATE POLICY "Users can view own image assets" ON public.image_assets
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own image assets" ON public.image_assets;
CREATE POLICY "Users can insert own image assets" ON public.image_assets
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own image assets" ON public.image_assets;
CREATE POLICY "Users can update own image assets" ON public.image_assets
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own image assets" ON public.image_assets;
CREATE POLICY "Users can delete own image assets" ON public.image_assets
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Tool Execution Logs policies
DROP POLICY IF EXISTS "Users can read own tool execution logs" ON public.tool_execution_logs;
CREATE POLICY "Users can read own tool execution logs" ON public.tool_execution_logs
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own tool execution logs" ON public.tool_execution_logs;
CREATE POLICY "Users can insert own tool execution logs" ON public.tool_execution_logs
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Cost Tracking policies
DROP POLICY IF EXISTS "Users can read own cost tracking" ON public.cost_tracking;
CREATE POLICY "Users can read own cost tracking" ON public.cost_tracking
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own cost tracking" ON public.cost_tracking;
CREATE POLICY "Users can insert own cost tracking" ON public.cost_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Reasoning History policies
DROP POLICY IF EXISTS "Users can read own reasoning history" ON public.reasoning_history;
CREATE POLICY "Users can read own reasoning history" ON public.reasoning_history
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own reasoning history" ON public.reasoning_history;
CREATE POLICY "Users can insert own reasoning history" ON public.reasoning_history
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Streaming Sessions policies
DROP POLICY IF EXISTS "Users can read own streaming sessions" ON public.streaming_sessions;
CREATE POLICY "Users can read own streaming sessions" ON public.streaming_sessions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own streaming sessions" ON public.streaming_sessions;
CREATE POLICY "Users can manage own streaming sessions" ON public.streaming_sessions
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- API Keys policies
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
CREATE POLICY "Users can view their own API keys" ON public.api_keys
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own API keys" ON public.api_keys;
CREATE POLICY "Users can create their own API keys" ON public.api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
CREATE POLICY "Users can update their own API keys" ON public.api_keys
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;
CREATE POLICY "Users can delete their own API keys" ON public.api_keys
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Funnels policies
DROP POLICY IF EXISTS "Users can insert their own funnels" ON public.funnels;
CREATE POLICY "Users can insert their own funnels" ON public.funnels
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own funnels" ON public.funnels;
CREATE POLICY "Users can update their own funnels" ON public.funnels
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own funnels" ON public.funnels;
CREATE POLICY "Users can delete their own funnels" ON public.funnels
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own funnels" ON public.funnels;
CREATE POLICY "Users can manage their own funnels" ON public.funnels
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- User Templates policies
DROP POLICY IF EXISTS "Users can view their own templates" ON public.user_templates;
CREATE POLICY "Users can view their own templates" ON public.user_templates
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own templates" ON public.user_templates;
CREATE POLICY "Users can insert their own templates" ON public.user_templates
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own templates" ON public.user_templates;
CREATE POLICY "Users can update their own templates" ON public.user_templates
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own templates" ON public.user_templates;
CREATE POLICY "Users can delete their own templates" ON public.user_templates
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- User Campaigns policies
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.user_campaigns;
CREATE POLICY "Users can view their own campaigns" ON public.user_campaigns
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.user_campaigns;
CREATE POLICY "Users can insert their own campaigns" ON public.user_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.user_campaigns;
CREATE POLICY "Users can update their own campaigns" ON public.user_campaigns
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.user_campaigns;
CREATE POLICY "Users can delete their own campaigns" ON public.user_campaigns
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- User Analytics policies
DROP POLICY IF EXISTS "Users can view their own analytics data" ON public.user_analytics;
CREATE POLICY "Users can view their own analytics data" ON public.user_analytics
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own analytics data" ON public.user_analytics;
CREATE POLICY "Users can insert their own analytics data" ON public.user_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own analytics data" ON public.user_analytics;
CREATE POLICY "Users can update their own analytics data" ON public.user_analytics
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
