import { NextRequest } from 'next/server';
import {
  withAuth,
  jsonResponse,
  errorResponse,
  parseJsonBody,
  validateRequiredFields,
} from '@/lib/api-utils';
import * as projectsService from '@/lib/services/projects';
import * as messagesService from '@/lib/services/messages';

// GET /api/v1/projects/[projectId]/sessions - List sessions
export const GET = withAuth<{ projectId: string }>(
  async (request, { userId, params }) => {
    try {
      const { projectId } = params;

      // Verify project ownership
      const project = await projectsService.getProject(userId, projectId);
      if (!project) {
        return errorResponse('Project not found', 404);
      }

      const sessions = await messagesService.getSessions(projectId);
      return jsonResponse(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return errorResponse(
        'Failed to fetch sessions',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }
);

// POST /api/v1/projects/[projectId]/sessions - Create a session
export const POST = withAuth<{ projectId: string }>(
  async (request, { userId, params }) => {
    try {
      const { projectId } = params;

      // Verify project ownership
      const project = await projectsService.getProject(userId, projectId);
      if (!project) {
        return errorResponse('Project not found', 404);
      }

      const body = await parseJsonBody(request);
      if (!body) {
        return errorResponse('Invalid JSON body', 400);
      }

      const validation = validateRequiredFields(body, ['source']);
      if (validation) {
        return errorResponse(validation, 400);
      }

      const session = await messagesService.createSession(
        projectId,
        body.source,
        body.external_id
      );

      return jsonResponse(session, 201);
    } catch (error) {
      console.error('Error creating session:', error);
      return errorResponse(
        'Failed to create session',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }
);
