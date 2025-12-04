import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized Supabase clients
let supabaseInstance: SupabaseClient | null = null;
let supabaseAnonInstance: SupabaseClient | null = null;

/**
 * Gets or creates the Supabase client with service role key
 * This bypasses RLS policies and should be used carefully
 */
function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    // Lazy load config to avoid initialization on module load
    const { config } = require('../config/env');

    supabaseInstance = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseInstance;
}

/**
 * Gets or creates the Supabase client with anon key
 * For operations that should respect RLS
 */
function getSupabaseAnonClient(): SupabaseClient {
  if (!supabaseAnonInstance) {
    // Lazy load config to avoid initialization on module load
    const { config } = require('../config/env');

    supabaseAnonInstance = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
      }
    );
  }
  return supabaseAnonInstance;
}

// Export as Proxy objects to maintain backward compatibility
// This allows using supabase.from() while keeping lazy initialization
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export const supabaseAnon = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabaseAnonClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export default supabase;
