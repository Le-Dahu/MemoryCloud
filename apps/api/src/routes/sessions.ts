import { FastifyInstance } from 'fastify';
import * as messagesService from '../services/messages';
import * as projectsService from '../services/projects';
import { getUserId } from '../middleware/auth';

interface CreateSessionBody {
  source: string;
  external_id?: string;
}

interface ProjectParams {
  projectId: string;
}

export async function sessionsRoutes(fastify: FastifyInstance) {
  // Create a new session in a project
  fastify.post<{
    Params: ProjectParams;
    Body: CreateSessionBody;
  }>('/projects/:projectId/sessions', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { projectId } = request.params;
      const { source, external_id } = request.body;

      if (!source || source.trim().length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Session source is required',
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

      // Create the session
      const session = await messagesService.createSession(
        projectId,
        source.trim(),
        external_id?.trim()
      );

      return reply.status(201).send({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('Error creating session:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to create session',
      });
    }
  });

  // Get all sessions for a project
  fastify.get<{
    Params: ProjectParams;
  }>('/projects/:projectId/sessions', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { projectId } = request.params;

      // Verify project exists and belongs to user
      const project = await projectsService.getProject(userId, projectId);
      if (!project) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      // Get sessions
      const sessions = await messagesService.getSessions(projectId);

      return reply.send({
        success: true,
        data: sessions,
        count: sessions.length,
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch sessions',
      });
    }
  });
}
