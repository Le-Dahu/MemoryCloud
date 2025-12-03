import { NextRequest } from 'next/server';
import { withAuth, jsonResponse, errorResponse } from '@/lib/api-utils';
import { supabase } from '@/lib/services/supabase';

// DELETE /api/v1/api-keys/[id] - Delete an API key
export const DELETE = withAuth<{ id: string }>(
  async (request, { userId, params }) => {
    try {
      const { id } = params;

      // Delete the API key (only if owned by the user)
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return jsonResponse({ message: 'API key deleted successfully' });
    } catch (error) {
      console.error('Error deleting API key:', error);
      return errorResponse(
        'Failed to delete API key',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }
);
