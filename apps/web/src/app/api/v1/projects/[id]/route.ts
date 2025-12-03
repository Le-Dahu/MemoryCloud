import { NextRequest } from 'next/server';
import {
  withAuth,
  jsonResponse,
  errorResponse,
  parseJsonBody,
} from '@/lib/api-utils';
import * as projectsService from '@/lib/services/projects';

// GET /api/v1/projects/[id] - Get a specific project
export const GET = withAuth<{ id: string }>(
  async (request, { userId, params }) => {
    try {
      const { id } = params;

      const project = await projectsService.getProject(userId, id);

      if (!project) {
        return errorResponse('Project not found', 404);
      }

      return jsonResponse(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      return errorResponse(
        'Failed to fetch project',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }
);

// PUT /api/v1/projects/[id] - Update a project
export const PUT = withAuth<{ id: string }>(
  async (request, { userId, params }) => {
    try {
      const { id } = params;
      const body = await parseJsonBody(request);

      if (!body) {
        return errorResponse('Invalid JSON body', 400);
      }

      const updates: any = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;

      const project = await projectsService.updateProject(userId, id, updates);

      return jsonResponse(project);
    } catch (error) {
      console.error('Error updating project:', error);
      return errorResponse(
        'Failed to update project',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }
);

// DELETE /api/v1/projects/[id] - Delete a project
export const DELETE = withAuth<{ id: string }>(
  async (request, { userId, params }) => {
    try {
      const { id } = params;

      await projectsService.deleteProject(userId, id);

      return jsonResponse({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting project:', error);
      return errorResponse(
        'Failed to delete project',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }
);
