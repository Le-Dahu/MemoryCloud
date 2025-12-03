import { NextRequest } from 'next/server';
import {
  withAuth,
  jsonResponse,
  errorResponse,
  parseJsonBody,
  validateRequiredFields,
} from '@/lib/api-utils';
import * as messagesService from '@/lib/services/messages';

// GET /api/v1/sessions/[sessionId]/messages - Get messages for a session
export const GET = withAuth<{ sessionId: string }>(
  async (request, { userId, params }) => {
    try {
      const { sessionId } = params;

      // Get session to verify ownership
      const session = await messagesService.getSession(sessionId);
      if (!session) {
        return errorResponse('Session not found', 404);
      }

      const messages = await messagesService.getMessages(sessionId);
      return jsonResponse(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return errorResponse(
        'Failed to fetch messages',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }
);

// POST /api/v1/sessions/[sessionId]/messages - Add a message
export const POST = withAuth<{ sessionId: string }>(
  async (request, { userId, params }) => {
    try {
      const { sessionId } = params;

      // Get session to verify ownership
      const session = await messagesService.getSession(sessionId);
      if (!session) {
        return errorResponse('Session not found', 404);
      }

      const body = await parseJsonBody(request);
      if (!body) {
        return errorResponse('Invalid JSON body', 400);
      }

      const validation = validateRequiredFields(body, ['role', 'content']);
      if (validation) {
        return errorResponse(validation, 400);
      }

      // Validate role
      const validRoles = ['user', 'assistant', 'system', 'function'];
      if (!validRoles.includes(body.role)) {
        return errorResponse(
          `Invalid role. Must be one of: ${validRoles.join(', ')}`,
          400
        );
      }

      const message = await messagesService.addMessage(
        sessionId,
        body.role,
        body.content,
        body.metadata || {}
      );

      return jsonResponse(message, 201);
    } catch (error) {
      console.error('Error adding message:', error);
      return errorResponse(
        'Failed to add message',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }
);
