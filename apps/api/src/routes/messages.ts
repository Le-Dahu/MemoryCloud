import { FastifyInstance } from 'fastify';
import * as messagesService from '../services/messages';
import { getUserId } from '../middleware/auth';
import { supabase } from '../services/supabase';

interface CreateMessageBody {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  metadata?: Record<string, any>;
}

interface SessionParams {
  sessionId: string;
}

export async function messagesRoutes(fastify: FastifyInstance) {
  // Add a message to a session
  fastify.post<{
    Params: SessionParams;
    Body: CreateMessageBody;
  }>('/sessions/:sessionId/messages', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { sessionId } = request.params;
      const { role, content, metadata } = request.body;

      // Validate input
      if (!role || !content) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Role and content are required',
        });
      }

      if (!['user', 'assistant', 'system', 'function'].includes(role)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid role. Must be one of: user, assistant, system, function',
        });
      }

      if (content.trim().length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Message content cannot be empty',
        });
      }

      // Verify session exists and user has access
      const session = await messagesService.getSession(sessionId);
      if (!session) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Session not found',
        });
      }

      // Verify user owns the project that owns this session
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', session.project_id)
        .single();

      if (projectError || !project || project.user_id !== userId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have access to this session',
        });
      }

      // Add the message
      const message = await messagesService.addMessage(
        sessionId,
        role,
        content.trim(),
        metadata || {}
      );

      return reply.status(201).send({
        success: true,
        data: message,
      });
    } catch (error) {
      console.error('Error creating message:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to create message',
      });
    }
  });

  // Get all messages for a session
  fastify.get<{
    Params: SessionParams;
  }>('/sessions/:sessionId/messages', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { sessionId } = request.params;

      // Verify session exists and user has access
      const session = await messagesService.getSession(sessionId);
      if (!session) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Session not found',
        });
      }

      // Verify user owns the project that owns this session
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', session.project_id)
        .single();

      if (projectError || !project || project.user_id !== userId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have access to this session',
        });
      }

      // Get messages
      const messages = await messagesService.getMessages(sessionId);

      return reply.send({
        success: true,
        data: messages,
        count: messages.length,
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch messages',
      });
    }
  });
}
