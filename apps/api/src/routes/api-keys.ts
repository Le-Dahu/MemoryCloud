import { FastifyInstance } from 'fastify';
import { createHash, randomBytes } from 'crypto';
import { getUserId } from '../middleware/auth';
import { supabase } from '../services/supabase';

interface CreateApiKeyBody {
  name: string;
}

interface ApiKeyParams {
  id: string;
}

// Generate a random API key with mc_ prefix
function generateApiKey(): string {
  const randomHex = randomBytes(16).toString('hex'); // 32 hex characters
  return `mc_${randomHex}`;
}

// Hash API key with SHA-256
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// Create key preview (first 7 + ... + last 4 characters)
function createKeyPreview(key: string): string {
  if (key.length < 12) return key;
  return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
}

export async function apiKeysRoutes(fastify: FastifyInstance) {
  // Create a new API key
  fastify.post<{
    Body: CreateApiKeyBody;
  }>('/', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { name } = request.body;

      if (!name || name.trim().length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'API key name is required',
        });
      }

      // Generate API key
      const apiKey = generateApiKey();
      const keyHash = hashApiKey(apiKey);
      const keyPreview = createKeyPreview(apiKey);

      // Insert into database
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          name: name.trim(),
          key_hash: keyHash,
          key_preview: keyPreview,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create API key: ${error.message}`);
      }

      // Return the API key (only time it will be shown in plain text)
      return reply.status(201).send({
        success: true,
        data: {
          id: data.id,
          name: data.name,
          key: apiKey, // ⚠️ Only shown once!
          key_preview: data.key_preview,
          created_at: data.created_at,
        },
        warning: 'Save this key now. It will not be shown again.',
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to create API key',
      });
    }
  });

  // List all API keys for the user (without the actual keys)
  fastify.get('/', async (request, reply) => {
    try {
      const userId = getUserId(request);

      const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select('id, name, key_preview, last_used_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch API keys: ${error.message}`);
      }

      return reply.send({
        success: true,
        data: apiKeys,
        count: apiKeys?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch API keys',
      });
    }
  });

  // Delete an API key
  fastify.delete<{
    Params: ApiKeyParams;
  }>('/:id', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { id } = request.params;

      // Delete the API key
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete API key: ${error.message}`);
      }

      return reply.send({
        success: true,
        message: 'API key deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to delete API key',
      });
    }
  });
}
