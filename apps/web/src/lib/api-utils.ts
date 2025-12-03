import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabase } from './services/supabase';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
}

/**
 * Parses the Authorization header and returns the API key
 * @param request - Next.js request object
 * @returns API key or null if not found
 */
export function parseAuthHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.split(' ')[1];

  if (!apiKey || !apiKey.startsWith('mc_')) {
    return null;
  }

  return apiKey;
}

/**
 * Verifies API key and returns user ID
 * @param apiKey - The API key to verify
 * @returns User ID or null if invalid
 */
export async function verifyApiKey(apiKey: string): Promise<string | null> {
  try {
    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    const { data: apiKeyRecord, error } = await supabase
      .from('api_keys')
      .select('user_id, id')
      .eq('key_hash', keyHash)
      .single();

    if (error || !apiKeyRecord) {
      return null;
    }

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id);

    return apiKeyRecord.user_id;
  } catch (error) {
    console.error('Error verifying API key:', error);
    return null;
  }
}

/**
 * Creates a standardized JSON response
 */
export function jsonResponse(
  data: any,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return jsonResponse(
    {
      error: message,
      ...(details && { details }),
    },
    status
  );
}

/**
 * Wrapper to require authentication on API routes
 * Usage: export const GET = withAuth(async (request, { userId, params }) => { ... })
 * Note: In Next.js 15+, params are async
 */
export function withAuth<P extends Record<string, any> = {}>(
  handler: (
    request: NextRequest,
    context: { userId: string; params: P }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    routeContext?: { params: Promise<P> }
  ): Promise<NextResponse> => {
    // Parse and verify API key
    const apiKey = parseAuthHeader(request);

    if (!apiKey) {
      return errorResponse('Unauthorized: Missing or invalid API key', 401);
    }

    const userId = await verifyApiKey(apiKey);

    if (!userId) {
      return errorResponse('Unauthorized: Invalid API key', 401);
    }

    // Await params if they're a promise (Next.js 15+)
    const params = routeContext?.params
      ? await routeContext.params
      : ({} as P);

    // Call the handler with userId and params
    return handler(request, {
      userId,
      params
    });
  };
}

/**
 * Development auth middleware that bypasses authentication
 * Only use in development!
 */
export function withDevAuth<P extends Record<string, any> = {}>(
  handler: (
    request: NextRequest,
    context: { userId: string; params: P }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    routeContext?: { params: Promise<P> }
  ): Promise<NextResponse> => {
    // Use a test user ID in development
    const userId = 'test-user-id';

    // Await params if they're a promise (Next.js 15+)
    const params = routeContext?.params
      ? await routeContext.params
      : ({} as P);

    return handler(request, {
      userId,
      params
    });
  };
}

/**
 * Parses JSON body from request
 */
export async function parseJsonBody<T = any>(
  request: NextRequest
): Promise<T | null> {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

/**
 * Validates required fields in request body
 */
export function validateRequiredFields(
  body: any,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (!(field in body) || body[field] === undefined || body[field] === null) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}
