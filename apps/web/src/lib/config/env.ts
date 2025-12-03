// Environment configuration for Next.js
// Next.js loads .env.local automatically

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  zep: {
    apiKey: process.env.ZEP_API_KEY || '',
  },
};

// Validation helper
export function validateConfig() {
  const missing: string[] = [];

  if (!config.supabase.url) missing.push('SUPABASE_URL');
  if (!config.supabase.anonKey) missing.push('SUPABASE_ANON_KEY');
  if (!config.supabase.serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!config.zep.apiKey) missing.push('ZEP_API_KEY');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
