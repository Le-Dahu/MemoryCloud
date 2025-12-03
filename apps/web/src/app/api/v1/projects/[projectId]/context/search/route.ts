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

// POST /api/v1/projects/[projectId]/context/search - Search context
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

      const validation = validateRequiredFields(body, ['query']);
      if (validation) {
        return errorResponse(validation, 400);
      }

      const maxTokens = body.max_tokens || 2000;

      const result = await messagesService.searchContext(
        projectId,
        body.query,
        maxTokens
      );

      return jsonResponse(result);
    } catch (error) {
      console.error('Error searching context:', error);
      return errorResponse(
        'Failed to search context',
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }
);
