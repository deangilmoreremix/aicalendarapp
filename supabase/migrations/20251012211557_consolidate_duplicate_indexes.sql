/*
  # Consolidate Duplicate Indexes

  1. Purpose
    - Remove duplicate indexes that index the same column(s)
    - Reduces storage and maintenance overhead
    - Keeps the more descriptive or consistently named index

  2. Changes
    - Drops duplicate indexes on contacts table (company and email)
    - Drops duplicate indexes on deals table (contact_id and customer_id)
    - Drops duplicate linkedin_profiles index
    - Keeps the idx_* prefixed versions for consistency

  3. Performance Impact
    - Reduced storage usage
    - Faster writes (fewer indexes to update)
    - Same query performance (kept one index for each column)
*/

-- Contacts table - keep idx_contacts_company, drop idx_contacts_company_lookup
DROP INDEX IF EXISTS public.idx_contacts_company_lookup;

-- Contacts table - keep idx_contacts_email, drop idx_contacts_email_lookup
DROP INDEX IF EXISTS public.idx_contacts_email_lookup;

-- Deals table - keep idx_deals_contact_id, drop idx_deals_contact_lookup
DROP INDEX IF EXISTS public.idx_deals_contact_lookup;

-- Deals table - keep idx_deals_customer_id, drop idx_deals_customer_lookup
DROP INDEX IF EXISTS public.idx_deals_customer_lookup;

-- LinkedIn profiles - keep the unique constraint, drop the regular index
DROP INDEX IF EXISTS public.linkedin_profiles_user_id_url_idx;
