import axios from 'axios';
import { config } from '../config.js';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: config.apiKey
    ? {
        Authorization: `Bearer ${config.apiKey}`,
      }
    : {},
});

/**
 * List all projects for the user
 */
export async function listProjects() {
  try {
    const response = await api.get('/api/v1/projects');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error listing projects: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Search for relevant context in a project
 */
export async function searchContext(args: {
  project_id: string;
  query: string;
  max_tokens?: number;
}) {
  try {
    const { project_id, query, max_tokens = 2000 } = args;

    const response = await api.post(
      `/api/v1/projects/${project_id}/context/search`,
      {
        query,
        max_tokens,
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error searching context: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Record an interaction (message) in project memory
 */
export async function recordInteraction(args: {
  project_id: string;
  session_id?: string;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
}) {
  try {
    const { project_id, session_id, role, content, source = 'mcp' } = args;

    // If no session_id provided, create a new session
    let finalSessionId = session_id;
    if (!finalSessionId) {
      const sessionResponse = await api.post(
        `/api/v1/projects/${project_id}/sessions`,
        {
          source,
        }
      );
      finalSessionId = sessionResponse.data.data.id;
    }

    // Record the message
    const response = await api.post(
      `/api/v1/sessions/${finalSessionId}/messages`,
      {
        role,
        content,
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ...response.data,
              session_id: finalSessionId,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error recording interaction: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Create a new project
 */
export async function createProject(args: {
  name: string;
  description?: string;
}) {
  try {
    const { name, description } = args;

    const response = await api.post('/api/v1/projects', {
      name,
      description,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error creating project: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

// Tool definitions for MCP
export const tools = [
  {
    name: 'list_projects',
    description: 'Liste tous les projets de l\'utilisateur',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'search_context',
    description: 'Recherche du contexte pertinent dans un projet',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'ID du projet dans lequel chercher',
        },
        query: {
          type: 'string',
          description: 'Requête de recherche',
        },
        max_tokens: {
          type: 'number',
          description: 'Nombre maximum de tokens à retourner',
          default: 2000,
        },
      },
      required: ['project_id', 'query'],
    },
  },
  {
    name: 'record_interaction',
    description: 'Enregistre un message dans la mémoire du projet',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'ID du projet',
        },
        session_id: {
          type: 'string',
          description: 'ID de la session (optionnel, crée une nouvelle session si non fourni)',
        },
        role: {
          type: 'string',
          enum: ['user', 'assistant'],
          description: 'Rôle du message',
        },
        content: {
          type: 'string',
          description: 'Contenu du message',
        },
        source: {
          type: 'string',
          description: 'Source du message',
          default: 'mcp',
        },
      },
      required: ['project_id', 'role', 'content'],
    },
  },
  {
    name: 'create_project',
    description: 'Crée un nouveau projet',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nom du projet',
        },
        description: {
          type: 'string',
          description: 'Description du projet (optionnel)',
        },
      },
      required: ['name'],
    },
  },
];

// Export tool handlers
export const toolHandlers = {
  list_projects: listProjects,
  search_context: searchContext,
  record_interaction: recordInteraction,
  create_project: createProject,
};
