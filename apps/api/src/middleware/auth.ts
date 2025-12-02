import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../services/supabase';
import { createHash } from 'crypto';

// Extend FastifyRequest to include userId
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

/**
 * Authentication middleware that verifies API keys
 * Expected format: Authorization: Bearer mc_xxxxx
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing Authorization header',
      });
    }

    // Parse Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid Authorization header format. Expected: Bearer <token>',
      });
    }

    const apiKey = parts[1];

    // Validate API key format (should start with mc_)
    if (!apiKey.startsWith('mc_')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid API key format',
      });
    }

    // Hash the API key (simple SHA-256 for now, can be upgraded to bcrypt)
    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    // Look up the API key in the database
    const { data: apiKeyRecord, error } = await supabase
      .from('api_keys')
      .select('user_id, id')
      .eq('key_hash', keyHash)
      .single();

    if (error || !apiKeyRecord) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
    }

    // Attach user_id to request for downstream handlers
    request.userId = apiKeyRecord.user_id;

    // Update last_used_at timestamp (fire and forget, no await)
    // We don't await this to avoid slowing down the request
    supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Helper to get userId from request (throws if not authenticated)
 */
export function getUserId(request: FastifyRequest): string {
  if (!request.userId) {
    throw new Error('User not authenticated');
  }
  return request.userId;
}

/**
 * Development-only: Middleware that uses a test user ID
 * Use this when API keys are not set up yet
 */
export async function devAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // For development: use a test user ID
  request.userId = 'test-user-id';
}
