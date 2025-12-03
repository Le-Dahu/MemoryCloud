import { supabase } from './supabase';
import * as zep from './zep';
import { Project } from '../types';

/**
 * Creates a new project
 * ZEP sessions are created automatically when the first message is added
 * @param userId - The user ID creating the project
 * @param name - Project name
 * @param description - Optional project description
 * @returns The created project
 */
export async function createProject(
  userId: string,
  name: string,
  description?: string
): Promise<Project> {
  try {
    // Create the project in Supabase
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name,
        description: description || null,
      })
      .select()
      .single();

    if (projectError) {
      throw new Error(`Failed to create project: ${projectError.message}`);
    }

    if (!project) {
      throw new Error('Project was not created');
    }

    // ZEP session will be created automatically when the first message is added
    // using the project.id as the ZEP sessionId

    return project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets all projects for a user
 * @param userId - The user ID
 * @returns Array of projects
 */
export async function getProjects(userId: string): Promise<Project[]> {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return projects || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error(`Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets a specific project by ID
 * @param userId - The user ID (for authorization)
 * @param projectId - The project ID
 * @returns The project or null if not found
 */
export async function getProject(
  userId: string,
  projectId: string
): Promise<Project | null> {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return project;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw new Error(`Failed to fetch project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Updates a project
 * @param userId - The user ID (for authorization)
 * @param projectId - The project ID
 * @param updates - Fields to update
 * @returns The updated project
 */
export async function updateProject(
  userId: string,
  projectId: string,
  updates: Partial<Pick<Project, 'name' | 'description'>>
): Promise<Project> {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    return project;
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes a project and its associated ZEP memory
 * @param userId - The user ID (for authorization)
 * @param projectId - The project ID
 */
export async function deleteProject(
  userId: string,
  projectId: string
): Promise<void> {
  try {
    // First, get the project to verify authorization
    const project = await getProject(userId, projectId);

    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    // Try to delete ZEP session memory (using project_id as session ID)
    try {
      await zep.deleteMemory(projectId);
    } catch (zepError) {
      console.warn('Failed to delete ZEP memory:', zepError);
      // Continue with project deletion even if ZEP deletion fails
    }

    // Delete the project (cascades to sessions and messages)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
};
