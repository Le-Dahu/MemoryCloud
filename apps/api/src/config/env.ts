import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Try to load .env from multiple locations
loadEnv({ path: resolve(process.cwd(), '.env') });
loadEnv({ path: resolve(process.cwd(), 'apps/api/.env') });
loadEnv({ path: resolve(__dirname, '../../../.env') });

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
