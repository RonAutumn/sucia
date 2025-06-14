import { supabase } from './supabase';
import type { 
  Prompt, 
  PromptCategory, 
  ApiResponse,
  DifficultyLevel,
  AppropriatenessLevel 
} from '../types/icebreaker';

// ============================================================================
// PROMPT CATEGORY SERVICES
// ============================================================================

export async function getPromptCategories(): Promise<ApiResponse<PromptCategory[]>> {
  try {
    const { data, error } = await supabase
      .from('prompt_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching prompt categories:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getPromptCategories:', error);
    return { success: false, error: 'Failed to fetch prompt categories' };
  }
}

export async function createPromptCategory(
  name: string, 
  description?: string
): Promise<ApiResponse<PromptCategory>> {
  try {
    const { data, error } = await supabase
      .from('prompt_categories')
      .insert([{ name, description }])
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt category:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createPromptCategory:', error);
    return { success: false, error: 'Failed to create prompt category' };
  }
}

export async function updatePromptCategory(
  id: number, 
  updates: Partial<Pick<PromptCategory, 'name' | 'description' | 'is_active'>>
): Promise<ApiResponse<PromptCategory>> {
  try {
    const { data, error } = await supabase
      .from('prompt_categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating prompt category:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updatePromptCategory:', error);
    return { success: false, error: 'Failed to update prompt category' };
  }
}

export async function deletePromptCategory(id: number): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('prompt_categories')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting prompt category:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deletePromptCategory:', error);
    return { success: false, error: 'Failed to delete prompt category' };
  }
}

// ============================================================================
// PROMPT SERVICES
// ============================================================================

export interface GetPromptsOptions {
  category_id?: number;
  difficulty_level?: DifficultyLevel;
  appropriateness_max?: AppropriatenessLevel;
  limit?: number;
  offset?: number;
  search?: string;
}

export async function getPrompts(options: GetPromptsOptions = {}): Promise<ApiResponse<Prompt[]>> {
  try {
    let query = supabase
      .from('prompts')
      .select(`
        *,
        category:prompt_categories(*)
      `)
      .eq('is_active', true);

    // Apply filters
    if (options.category_id) {
      query = query.eq('category_id', options.category_id);
    }

    if (options.difficulty_level) {
      query = query.eq('difficulty_level', options.difficulty_level);
    }

    if (options.appropriateness_max) {
      query = query.lte('appropriateness_level', options.appropriateness_max);
    }

    if (options.search) {
      query = query.ilike('content', `%${options.search}%`);
    }

    // Apply pagination
    if (options.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
    } else if (options.limit) {
      query = query.limit(options.limit);
    }

    query = query.order('id');

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching prompts:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getPrompts:', error);
    return { success: false, error: 'Failed to fetch prompts' };
  }
}

export async function getRandomPrompts(
  count: number,
  options: Omit<GetPromptsOptions, 'limit' | 'offset'> = {}
): Promise<ApiResponse<Prompt[]>> {
  try {
    // First get total count with filters
    let countQuery = supabase
      .from('prompts')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (options.category_id) {
      countQuery = countQuery.eq('category_id', options.category_id);
    }

    if (options.difficulty_level) {
      countQuery = countQuery.eq('difficulty_level', options.difficulty_level);
    }

    if (options.appropriateness_max) {
      countQuery = countQuery.lte('appropriateness_level', options.appropriateness_max);
    }

    const { count, error: countError } = await countQuery;

    if (countError || !count) {
      console.error('Error counting prompts:', countError);
      return { success: false, error: 'Failed to count prompts' };
    }

    // Generate random offsets
    const randomOffsets = Array.from({ length: Math.min(count, count) }, () => 
      Math.floor(Math.random() * count)
    ).slice(0, count);

    // Fetch random prompts
    const promises = randomOffsets.map(offset => 
      getPrompts({ ...options, limit: 1, offset })
    );

    const results = await Promise.all(promises);
    
    const allPrompts: Prompt[] = [];
    for (const result of results) {
      if (result.success && result.data && result.data.length > 0) {
        allPrompts.push(result.data[0]);
      }
    }

    // Remove duplicates and take requested count
    const uniquePrompts = Array.from(
      new Map(allPrompts.map(p => [p.id, p])).values()
    ).slice(0, count);

    return { success: true, data: uniquePrompts };
  } catch (error) {
    console.error('Error in getRandomPrompts:', error);
    return { success: false, error: 'Failed to fetch random prompts' };
  }
}

export async function createPrompt(
  content: string,
  category_id?: number,
  difficulty_level: DifficultyLevel = 2,
  appropriateness_level: AppropriatenessLevel = 3
): Promise<ApiResponse<Prompt>> {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .insert([{ 
        content, 
        category_id, 
        difficulty_level, 
        appropriateness_level 
      }])
      .select(`
        *,
        category:prompt_categories(*)
      `)
      .single();

    if (error) {
      console.error('Error creating prompt:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createPrompt:', error);
    return { success: false, error: 'Failed to create prompt' };
  }
}

export async function updatePrompt(
  id: number,
  updates: Partial<Pick<Prompt, 'content' | 'category_id' | 'difficulty_level' | 'appropriateness_level' | 'is_active'>>
): Promise<ApiResponse<Prompt>> {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        category:prompt_categories(*)
      `)
      .single();

    if (error) {
      console.error('Error updating prompt:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updatePrompt:', error);
    return { success: false, error: 'Failed to update prompt' };
  }
}

export async function deletePrompt(id: number): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('prompts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting prompt:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deletePrompt:', error);
    return { success: false, error: 'Failed to delete prompt' };
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function bulkCreatePrompts(
  prompts: Array<{
    content: string;
    category_id?: number;
    difficulty_level?: DifficultyLevel;
    appropriateness_level?: AppropriatenessLevel;
  }>
): Promise<ApiResponse<Prompt[]>> {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .insert(prompts)
      .select(`
        *,
        category:prompt_categories(*)
      `);

    if (error) {
      console.error('Error bulk creating prompts:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in bulkCreatePrompts:', error);
    return { success: false, error: 'Failed to bulk create prompts' };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function validatePromptContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Prompt content cannot be empty' };
  }

  if (content.length > 500) {
    return { valid: false, error: 'Prompt content must be less than 500 characters' };
  }

  // Check for appropriate ice breaker format
  if (!content.toLowerCase().includes('find someone who')) {
    return { valid: false, error: 'Prompt should start with "Find someone who..."' };
  }

  return { valid: true };
}

export function getPromptsByDifficulty(prompts: Prompt[]): Record<DifficultyLevel, Prompt[]> {
  return prompts.reduce((acc, prompt) => {
    if (!acc[prompt.difficulty_level]) {
      acc[prompt.difficulty_level] = [];
    }
    acc[prompt.difficulty_level].push(prompt);
    return acc;
  }, {} as Record<DifficultyLevel, Prompt[]>);
}

export function filterPromptsByAppropriateness(
  prompts: Prompt[], 
  maxLevel: AppropriatenessLevel
): Prompt[] {
  return prompts.filter(prompt => prompt.appropriateness_level <= maxLevel);
} 