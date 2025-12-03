import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

// Initialize Supabase client with service role key for full access
// This bypasses RLS policies and should be used carefully
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// For operations that should respect RLS, use this client with anon key
export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

export default supabase;
