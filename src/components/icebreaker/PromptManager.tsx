import React, { useState, useEffect } from 'react';
import { 
  getPrompts, 
  getPromptCategories, 
  createPrompt, 
  updatePrompt, 
  deletePrompt,
  validatePromptContent 
} from '../../utils/icebreaker-api';
import type { 
  Prompt, 
  PromptCategory, 
  DifficultyLevel, 
  AppropriatenessLevel 
} from '../../types/icebreaker';
import { 
  DIFFICULTY_LABELS, 
  APPROPRIATENESS_LABELS 
} from '../../types/icebreaker';

interface PromptManagerProps {
  onPromptChange?: () => void;
}

interface PromptFormData {
  content: string;
  category_id?: number;
  difficulty_level: DifficultyLevel;
  appropriateness_level: AppropriatenessLevel;
}

export default function PromptManager({ onPromptChange }: PromptManagerProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState<PromptFormData>({
    content: '',
    difficulty_level: 2,
    appropriateness_level: 3
  });
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    category_id: undefined as number | undefined,
    difficulty_level: undefined as DifficultyLevel | undefined,
    appropriateness_max: undefined as AppropriatenessLevel | undefined,
    search: ''
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    setError(undefined);

    try {
      // Load categories
      const categoriesResult = await getPromptCategories();
      if (categoriesResult.success) {
        setCategories(categoriesResult.data || []);
      }

      // Load prompts with filters
      const promptsResult = await getPrompts(filters);
      if (promptsResult.success) {
        setPrompts(promptsResult.data || []);
      } else {
        setError(promptsResult.error);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);
    setSubmitting(true);

    try {
      // Validate content
      const validation = validatePromptContent(formData.content);
      if (!validation.valid) {
        setFormError(validation.error);
        return;
      }

      let result;
      if (editingPrompt) {
        // Update existing prompt
        result = await updatePrompt(editingPrompt.id, formData);
      } else {
        // Create new prompt
        result = await createPrompt(
          formData.content,
          formData.category_id,
          formData.difficulty_level,
          formData.appropriateness_level
        );
      }

      if (result.success) {
        await loadData();
        resetForm();
        onPromptChange?.();
      } else {
        setFormError(result.error);
      }
    } catch (err) {
      setFormError('Failed to save prompt');
      console.error('Error saving prompt:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      content: prompt.content,
      category_id: prompt.category_id,
      difficulty_level: prompt.difficulty_level,
      appropriateness_level: prompt.appropriateness_level
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (prompt: Prompt) => {
    if (!confirm(`Are you sure you want to delete this prompt?\n\n"${prompt.content}"`)) {
      return;
    }

    try {
      const result = await deletePrompt(prompt.id);
      if (result.success) {
        await loadData();
        onPromptChange?.();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to delete prompt');
      console.error('Error deleting prompt:', err);
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingPrompt(null);
    setFormData({
      content: '',
      difficulty_level: 2,
      appropriateness_level: 3
    });
    setFormError(undefined);
  };

  const getAppropriatenessColor = (level: AppropriatenessLevel) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800', 
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    };
    return colors[level];
  };

  const getDifficultyColor = (level: DifficultyLevel) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-red-100 text-red-800'
    };
    return colors[level];
  };

  if (loading && prompts.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Ice Breaker Bingo - Prompt Manager
        </h1>
        <p className="text-gray-600">
          Manage steamy ice breaker prompts for bingo cards
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category_id || ''}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              value={filters.difficulty_level || ''}
              onChange={(e) => setFilters({ ...filters, difficulty_level: e.target.value ? Number(e.target.value) as DifficultyLevel : undefined })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Difficulties</option>
              {Object.entries(DIFFICULTY_LABELS).map(([level, label]) => (
                <option key={level} value={level}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Steaminess
            </label>
            <select
              value={filters.appropriateness_max || ''}
              onChange={(e) => setFilters({ ...filters, appropriateness_max: e.target.value ? Number(e.target.value) as AppropriatenessLevel : undefined })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Levels</option>
              {Object.entries(APPROPRIATENESS_LABELS).map(([level, label]) => (
                <option key={level} value={level}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search prompts..."
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Add Prompt Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Prompt
        </button>
        <span className="ml-4 text-gray-600">
          Total: {prompts.length} prompts
        </span>
      </div>

      {/* Prompt Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">
              {editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
            </h3>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <div className="text-red-800 text-sm">{formError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Find someone who..."
                  className="w-full p-3 border border-gray-300 rounded-md h-24"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Should start with "Find someone who..." (max 500 characters)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">No Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty_level}
                    onChange={(e) => setFormData({ ...formData, difficulty_level: Number(e.target.value) as DifficultyLevel })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {Object.entries(DIFFICULTY_LABELS).map(([level, label]) => (
                      <option key={level} value={level}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Steaminess Level
                  </label>
                  <select
                    value={formData.appropriateness_level}
                    onChange={(e) => setFormData({ ...formData, appropriateness_level: Number(e.target.value) as AppropriatenessLevel })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {Object.entries(APPROPRIATENESS_LABELS).map(([level, label]) => (
                      <option key={level} value={level}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingPrompt ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prompts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Steaminess
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prompts.map((prompt) => (
                <tr key={prompt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-md">
                      {prompt.content}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {prompt.category?.name || 'No Category'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(prompt.difficulty_level)}`}>
                      {DIFFICULTY_LABELS[prompt.difficulty_level]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAppropriatenessColor(prompt.appropriateness_level)}`}>
                      {APPROPRIATENESS_LABELS[prompt.appropriateness_level]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(prompt)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prompt)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {prompts.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No prompts found. {filters.search || filters.category_id || filters.difficulty_level || filters.appropriateness_max ? 'Try adjusting your filters.' : 'Add some prompts to get started.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 