import { FastifyInstance } from 'fastify';
import * as messagesService from '../services/messages';
import * as projectsService from '../services/projects';
import { getUserId } from '../middleware/auth';

interface SearchContextBody {
  query: string;
  max_tokens?: number;
}

interface ProjectParams {
  projectId: string;
}

export async function contextRoutes(fastify: FastifyInstance) {
  // Search for relevant context in a project
  fastify.post<{
    Params: ProjectParams;
    Body: SearchContextBody;
  }>('/projects/:projectId/context/search', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { projectId } = request.params;
      const { query, max_tokens } = request.body;

      // Validate input
      if (!query || query.trim().length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Search query is required',
        });
      }

      // Validate max_tokens if provided
      const maxTokens = max_tokens || 2000;
      if (maxTokens < 100 || maxTokens > 10000) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'max_tokens must be between 100 and 10000',
        });
      }

      // Verify project exists and belongs to user
      const project = await projectsService.getProject(userId, projectId);
      if (!project) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      // Perform context search
      const result = await messagesService.searchContext(
        projectId,
        query.trim(),
        maxTokens
      );

      return reply.send({
        success: true,
        data: {
          messages: result.messages,
          total_tokens: result.total_tokens,
          query: query.trim(),
          max_tokens: maxTokens,
        },
      });
    } catch (error) {
      console.error('Error searching context:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to search context',
      });
    }
  });
}
