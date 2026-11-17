-- NOTE: every statement is guarded so this migration is a no-op for tables that do not exist in this database
-- (it was written for a larger schema; this app only has contacts, tasks, deals, activities, calendar_*).
/*
  # Optimize RLS Policies - Part 3 (Admin & System Tables)

  1. Purpose
    - Optimize admin-related RLS policies
    - Fix policies for system tables with auth checks
    - Optimize funnel and template-related policies

  2. Changes
    - Optimizes admin_users, admin_audit_log, import_logs policies
    - Optimizes funnel templates, ratings, and favorites policies
    - Optimizes app content and settings policies

  3. Performance Impact
    - Improves admin dashboard performance
    - Better performance for template browsing
    - Optimized funnel analytics queries
*/

-- Admin Users policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Admins can manage admin users" ON public.admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role = 'super_admin'
    )
  );
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Admins can view their own profile" ON public.admin_users;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Admins can view their own profile" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Admin Audit Log policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Admin users can view audit logs" ON public.admin_audit_log;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Admin users can view audit logs" ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role IN ('super_admin', 'admin')
    )
  );
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Import Logs policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Admins can view import logs" ON public.import_logs;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Admins can view import logs" ON public.import_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role IN ('super_admin', 'admin')
    )
  );
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- App Features policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Admin users can manage app features" ON public.app_features;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Admin users can manage app features" ON public.app_features
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role = 'super_admin'
    )
  );
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- App Users policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Admin users can manage app users" ON public.app_users;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Admin users can manage app users" ON public.app_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role IN ('super_admin', 'admin')
    )
  );
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Apps policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Admin users can manage apps" ON public.apps;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Admin users can manage apps" ON public.apps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role = 'super_admin'
    )
  );
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Features policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Admin users can manage features" ON public.features;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Admin users can manage features" ON public.features
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role = 'super_admin'
    )
  );
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Videos policies (admin)
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Admins can manage videos" ON public.videos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role IN ('super_admin', 'admin')
    )
  );
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Funnel Templates policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can create templates" ON public.funnel_templates;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can create templates" ON public.funnel_templates
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update own templates" ON public.funnel_templates;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update own templates" ON public.funnel_templates
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can delete own templates" ON public.funnel_templates;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can delete own templates" ON public.funnel_templates
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON public.funnel_templates;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Public templates are viewable by everyone" ON public.funnel_templates
  FOR SELECT
  USING (is_public = true OR (select auth.uid()) = created_by);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Template Ratings policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can create ratings" ON public.template_ratings;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can create ratings" ON public.template_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can update own ratings" ON public.template_ratings;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can update own ratings" ON public.template_ratings
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can delete own ratings" ON public.template_ratings;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can delete own ratings" ON public.template_ratings
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- User Template Favorites policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can add favorites" ON public.user_template_favorites;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can add favorites" ON public.user_template_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can view own favorites" ON public.user_template_favorites;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can view own favorites" ON public.user_template_favorites
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can remove own favorites" ON public.user_template_favorites;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can remove own favorites" ON public.user_template_favorites
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- App Content policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.app_content;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Enable insert for authenticated users only" ON public.app_content
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Enable update for authenticated users on their own content" ON public.app_content;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Enable update for authenticated users on their own content" ON public.app_content
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

DO $guard$ BEGIN
DROP POLICY IF EXISTS "Enable delete for authenticated users on their own content" ON public.app_content;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Enable delete for authenticated users on their own content" ON public.app_content
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- App Settings policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can manage own settings" ON public.app_settings;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can manage own settings" ON public.app_settings
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;

-- Conversation Context Cache policies
DO $guard$ BEGIN
DROP POLICY IF EXISTS "Users can manage own conversation cache" ON public.conversation_context_cache;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
DO $guard$ BEGIN
CREATE POLICY "Users can manage own conversation cache" ON public.conversation_context_cache
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $guard$;
