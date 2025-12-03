import { NextRequest } from 'next/server';
import {
  withAuth,
  jsonResponse,
  errorResponse,
  parseJsonBody,
  validateRequiredFields,
} from '@/lib/api-utils';
import * as projectsService from '@/lib/services/projects';

// GET /api/v1/projects - List all projects
export const GET = withAuth(async (request, { userId }) => {
  try {
    const projects = await projectsService.getProjects(userId);
    return jsonResponse(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return errorResponse(
      'Failed to fetch projects',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
});

// POST /api/v1/projects - Create a new project
export const POST = withAuth(async (request, { userId }) => {
  try {
    const body = await parseJsonBody(request);

    if (!body) {
      return errorResponse('Invalid JSON body', 400);
    }

    const validation = validateRequiredFields(body, ['name']);
    if (validation) {
      return errorResponse(validation, 400);
    }

    const project = await projectsService.createProject(
      userId,
      body.name,
      body.description
    );

    return jsonResponse(project, 201);
  } catch (error) {
    console.error('Error creating project:', error);
    return errorResponse(
      'Failed to create project',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
});
