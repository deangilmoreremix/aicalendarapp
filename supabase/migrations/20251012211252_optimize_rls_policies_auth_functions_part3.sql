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
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;
CREATE POLICY "Admins can manage admin users" ON public.admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view their own profile" ON public.admin_users;
CREATE POLICY "Admins can view their own profile" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- Admin Audit Log policies
DROP POLICY IF EXISTS "Admin users can view audit logs" ON public.admin_audit_log;
CREATE POLICY "Admin users can view audit logs" ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role IN ('super_admin', 'admin')
    )
  );

-- Import Logs policies
DROP POLICY IF EXISTS "Admins can view import logs" ON public.import_logs;
CREATE POLICY "Admins can view import logs" ON public.import_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role IN ('super_admin', 'admin')
    )
  );

-- App Features policies
DROP POLICY IF EXISTS "Admin users can manage app features" ON public.app_features;
CREATE POLICY "Admin users can manage app features" ON public.app_features
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role = 'super_admin'
    )
  );

-- App Users policies
DROP POLICY IF EXISTS "Admin users can manage app users" ON public.app_users;
CREATE POLICY "Admin users can manage app users" ON public.app_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role IN ('super_admin', 'admin')
    )
  );

-- Apps policies
DROP POLICY IF EXISTS "Admin users can manage apps" ON public.apps;
CREATE POLICY "Admin users can manage apps" ON public.apps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role = 'super_admin'
    )
  );

-- Features policies
DROP POLICY IF EXISTS "Admin users can manage features" ON public.features;
CREATE POLICY "Admin users can manage features" ON public.features
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role = 'super_admin'
    )
  );

-- Videos policies (admin)
DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;
CREATE POLICY "Admins can manage videos" ON public.videos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = (select auth.uid()) AND au.role IN ('super_admin', 'admin')
    )
  );

-- Funnel Templates policies
DROP POLICY IF EXISTS "Users can create templates" ON public.funnel_templates;
CREATE POLICY "Users can create templates" ON public.funnel_templates
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update own templates" ON public.funnel_templates;
CREATE POLICY "Users can update own templates" ON public.funnel_templates
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete own templates" ON public.funnel_templates;
CREATE POLICY "Users can delete own templates" ON public.funnel_templates
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON public.funnel_templates;
CREATE POLICY "Public templates are viewable by everyone" ON public.funnel_templates
  FOR SELECT
  USING (is_public = true OR (select auth.uid()) = created_by);

-- Template Ratings policies
DROP POLICY IF EXISTS "Users can create ratings" ON public.template_ratings;
CREATE POLICY "Users can create ratings" ON public.template_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own ratings" ON public.template_ratings;
CREATE POLICY "Users can update own ratings" ON public.template_ratings
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own ratings" ON public.template_ratings;
CREATE POLICY "Users can delete own ratings" ON public.template_ratings
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- User Template Favorites policies
DROP POLICY IF EXISTS "Users can add favorites" ON public.user_template_favorites;
CREATE POLICY "Users can add favorites" ON public.user_template_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own favorites" ON public.user_template_favorites;
CREATE POLICY "Users can view own favorites" ON public.user_template_favorites
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove own favorites" ON public.user_template_favorites;
CREATE POLICY "Users can remove own favorites" ON public.user_template_favorites
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- App Content policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.app_content;
CREATE POLICY "Enable insert for authenticated users only" ON public.app_content
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Enable update for authenticated users on their own content" ON public.app_content;
CREATE POLICY "Enable update for authenticated users on their own content" ON public.app_content
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Enable delete for authenticated users on their own content" ON public.app_content;
CREATE POLICY "Enable delete for authenticated users on their own content" ON public.app_content
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- App Settings policies
DROP POLICY IF EXISTS "Users can manage own settings" ON public.app_settings;
CREATE POLICY "Users can manage own settings" ON public.app_settings
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Conversation Context Cache policies
DROP POLICY IF EXISTS "Users can manage own conversation cache" ON public.conversation_context_cache;
CREATE POLICY "Users can manage own conversation cache" ON public.conversation_context_cache
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
