-- NOTE: every statement is guarded so this migration is a no-op for tables that do not exist in this database
-- (it was written for a larger schema; this app only has contacts, tasks, deals, activities, calendar_*).
/*
  # Fix Remaining Security Issues - Core Tables Only

  1. Purpose
    - Enable RLS on public tables that have user_id columns
    - Add appropriate policies for user-owned resources
    - Skip tables without clear ownership models

  2. Changes
    - Enables RLS on user-owned resource tables
    - Adds policies for tables with user_id
    - Leaves system tables for separate migration

  3. Security Impact
    - Critical user data tables are now protected
    - User isolation enforced on personal resources
*/

-- Enable RLS and add policies for api_usage
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.api_usage ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own API usage" ON public.api_usage;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own API usage" ON public.api_usage
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can insert own API usage" ON public.api_usage;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can insert own API usage" ON public.api_usage
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS and add policies for generated_videos
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.generated_videos ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can manage own videos" ON public.generated_videos;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can manage own videos" ON public.generated_videos
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS and add policies for generated_images
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.generated_images ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can manage own images" ON public.generated_images;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can manage own images" ON public.generated_images
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS and add policies for reference_images
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.reference_images ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can manage own reference images" ON public.reference_images;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can manage own reference images" ON public.reference_images
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS and add policies for user_fonts
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.user_fonts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can manage own fonts" ON public.user_fonts;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can manage own fonts" ON public.user_fonts
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS and add policies for user_projects
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.user_projects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can manage own projects" ON public.user_projects;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can manage own projects" ON public.user_projects
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS and add policies for project_images
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.project_images ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can manage project images" ON public.project_images;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can manage project images" ON public.project_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_projects up
      WHERE up.id = project_images.project_id
      AND up.user_id = (select auth.uid())
    )
  );
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS and add policies for entitlements
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.entitlements ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own entitlements" ON public.entitlements;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own entitlements" ON public.entitlements
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS and add policies for purchases
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.purchases ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS for products (public read, admin write)
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Products are viewable by all" ON public.products;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Products are viewable by all" ON public.products
  FOR SELECT
  USING (true);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role = 'super_admin'
    )
  );
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS for web_search_results (read-only for authenticated)
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.web_search_results ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view web search results" ON public.web_search_results;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view web search results" ON public.web_search_results
  FOR SELECT
  TO authenticated
  USING (true);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS for partner_applications (read for authenticated)
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Authenticated users can view partner applications" ON public.partner_applications;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Authenticated users can view partner applications" ON public.partner_applications
  FOR SELECT
  TO authenticated
  USING (true);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS for partner_stats (read for authenticated)
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Authenticated users can view partner stats" ON public.partner_stats;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Authenticated users can view partner stats" ON public.partner_stats
  FOR SELECT
  TO authenticated
  USING (true);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Enable RLS for remaining tables (will restrict all access until proper policies are added)
-- This is secure-by-default
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.personalization_tokens ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.code_executions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
ALTER TABLE IF EXISTS public.conversation_attachments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
