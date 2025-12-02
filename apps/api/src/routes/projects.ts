import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as projectsService from '../services/projects';
import { getUserId } from '../middleware/auth';
import { CreateProjectRequest } from '../types';

interface CreateProjectBody {
  name: string;
  description?: string;
}

interface UpdateProjectBody {
  name?: string;
  description?: string;
}

interface ProjectParams {
  id: string;
}

export async function projectsRoutes(fastify: FastifyInstance) {
  // Create a new project
  fastify.post<{
    Body: CreateProjectBody;
  }>('/', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { name, description } = request.body;

      if (!name || name.trim().length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Project name is required',
        });
      }

      const project = await projectsService.createProject(
        userId,
        name.trim(),
        description?.trim()
      );

      return reply.status(201).send({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error('Error creating project:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to create project',
      });
    }
  });

  // Get all projects for the authenticated user
  fastify.get('/', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const projects = await projectsService.getProjects(userId);

      return reply.send({
        success: true,
        data: projects,
        count: projects.length,
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch projects',
      });
    }
  });

  // Get a specific project by ID
  fastify.get<{
    Params: ProjectParams;
  }>('/:id', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { id } = request.params;

      const project = await projectsService.getProject(userId, id);

      if (!project) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      return reply.send({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch project',
      });
    }
  });

  // Update a project
  fastify.put<{
    Params: ProjectParams;
    Body: UpdateProjectBody;
  }>('/:id', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { id } = request.params;
      const updates = request.body;

      if (!updates.name && !updates.description) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'At least one field (name or description) must be provided',
        });
      }

      // Trim values if provided
      const cleanUpdates: UpdateProjectBody = {};
      if (updates.name) cleanUpdates.name = updates.name.trim();
      if (updates.description !== undefined) {
        cleanUpdates.description = updates.description?.trim();
      }

      const project = await projectsService.updateProject(userId, id, cleanUpdates);

      return reply.send({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error('Error updating project:', error);
      const statusCode = error instanceof Error && error.message.includes('not found')
        ? 404
        : 500;
      return reply.status(statusCode).send({
        error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to update project',
      });
    }
  });

  // Delete a project
  fastify.delete<{
    Params: ProjectParams;
  }>('/:id', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { id } = request.params;

      await projectsService.deleteProject(userId, id);

      return reply.send({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      const statusCode = error instanceof Error && error.message.includes('not found')
        ? 404
        : 500;
      return reply.status(statusCode).send({
        error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to delete project',
      });
    }
  });
}
