import { NextRequest } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import {
  withAuth,
  jsonResponse,
  errorResponse,
  parseJsonBody,
  validateRequiredFields,
} from '@/lib/api-utils';
import { supabase } from '@/lib/services/supabase';

/**
 * Generates a new API key with format: mc_<32 hex characters>
 */
function generateApiKey(): string {
  const randomHex = randomBytes(16).toString('hex');
  return `mc_${randomHex}`;
}

/**
 * Hashes an API key using SHA-256
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Creates a preview of the API key (first 7 + ... + last 4 chars)
 */
function createKeyPreview(key: string): string {
  return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
}

// GET /api/v1/api-keys - List all API keys
export const GET = withAuth(async (request, { userId }) => {
  try {
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, key_preview, last_used_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return jsonResponse(apiKeys || []);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return errorResponse(
      'Failed to fetch API keys',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
});

// POST /api/v1/api-keys - Generate a new API key
export const POST = withAuth(async (request, { userId }) => {
  try {
    const body = await parseJsonBody(request);

    if (!body) {
      return errorResponse('Invalid JSON body', 400);
    }

    const validation = validateRequiredFields(body, ['name']);
    if (validation) {
      return errorResponse(validation, 400);
    }

    // Generate the API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    const keyPreview = createKeyPreview(apiKey);

    // Store in database
    const { data: apiKeyRecord, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: body.name,
        key_hash: keyHash,
        key_preview: keyPreview,
      })
      .select('id, name, key_preview, created_at')
      .single();

    if (error) {
      throw error;
    }

    // Return the full key (only time it will be shown)
    return jsonResponse(
      {
        ...apiKeyRecord,
        key: apiKey,
        warning: 'Save this key now - it will not be shown again!',
      },
      201
    );
  } catch (error) {
    console.error('Error creating API key:', error);
    return errorResponse(
      'Failed to create API key',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
});
