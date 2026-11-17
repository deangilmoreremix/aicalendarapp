-- NOTE: every statement is guarded so this migration is a no-op for tables that do not exist in this database
-- (it was written for a larger schema; this app only has contacts, tasks, deals, activities, calendar_*).
/*
  # Optimize RLS Policies - Part 1 (Core Tables)

  1. Purpose
    - Fix RLS policies that re-evaluate auth functions for each row
    - Replace `auth.uid()` with `(select auth.uid())` for better performance
    - Focuses on most frequently accessed tables first

  2. Changes
    - Recreates policies on core tables (users, contacts, deals, tasks, funnels)
    - Uses subquery pattern for auth functions
    - Maintains same security logic with better performance

  3. Performance Impact
    - Significantly improves query performance at scale
    - Reduces CPU usage for large result sets
    - Auth function evaluated once per query instead of per row
*/

-- Users table policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- AI Context State policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own context state" ON public.ai_context_state;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own context state" ON public.ai_context_state
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert own context state" ON public.ai_context_state;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert own context state" ON public.ai_context_state
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update own context state" ON public.ai_context_state;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update own context state" ON public.ai_context_state
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can delete own context state" ON public.ai_context_state;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can delete own context state" ON public.ai_context_state
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- AI Generations policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own AI generations" ON public.ai_generations;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own AI generations" ON public.ai_generations
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert own AI generations" ON public.ai_generations;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert own AI generations" ON public.ai_generations
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- AI Function Calls policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own function calls" ON public.ai_function_calls;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own function calls" ON public.ai_function_calls
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert own function calls" ON public.ai_function_calls;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert own function calls" ON public.ai_function_calls
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update own function calls" ON public.ai_function_calls;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update own function calls" ON public.ai_function_calls
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- AI Execution History policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own execution history" ON public.ai_execution_history;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own execution history" ON public.ai_execution_history
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "System can insert execution history" ON public.ai_execution_history;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "System can insert execution history" ON public.ai_execution_history
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- AI Pending Actions policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own pending actions" ON public.ai_pending_actions;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own pending actions" ON public.ai_pending_actions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert own pending actions" ON public.ai_pending_actions;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert own pending actions" ON public.ai_pending_actions
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update own pending actions" ON public.ai_pending_actions;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update own pending actions" ON public.ai_pending_actions
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- AI Undo Snapshots policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own undo snapshots" ON public.ai_undo_snapshots;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own undo snapshots" ON public.ai_undo_snapshots
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "System can insert undo snapshots" ON public.ai_undo_snapshots;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "System can insert undo snapshots" ON public.ai_undo_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- AI Model Preferences policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own model preferences" ON public.ai_model_preferences;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own model preferences" ON public.ai_model_preferences
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert own model preferences" ON public.ai_model_preferences;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert own model preferences" ON public.ai_model_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update own model preferences" ON public.ai_model_preferences;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update own model preferences" ON public.ai_model_preferences
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can delete own model preferences" ON public.ai_model_preferences;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can delete own model preferences" ON public.ai_model_preferences
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- AI User Permissions policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own permissions" ON public.ai_user_permissions;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own permissions" ON public.ai_user_permissions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert own permissions" ON public.ai_user_permissions;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert own permissions" ON public.ai_user_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update own permissions" ON public.ai_user_permissions;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update own permissions" ON public.ai_user_permissions
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- AI Workflows policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own workflows" ON public.ai_workflows;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own workflows" ON public.ai_workflows
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert own workflows" ON public.ai_workflows;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert own workflows" ON public.ai_workflows
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update own workflows" ON public.ai_workflows;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update own workflows" ON public.ai_workflows
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
