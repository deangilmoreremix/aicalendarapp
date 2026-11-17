// Test stub for `jsr:@supabase/supabase-js@2`: tests install their own client through globalThis.__supabaseStub.
export const createClient = (...args: unknown[]) => (globalThis as any).__supabaseStub?.(...args);
