import React, { useState } from 'react';
import { Game, Poll, Trivia, Icebreaker, Bingo, Event, PollOption, TriviaQuestion, IcebreakerPrompt, BingoItem } from '../types';

interface GameCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameCreate: (game: Game) => void;
  event: Event;
}

type GameType = 'poll' | 'trivia' | 'icebreaker' | 'bingo';

const GameCreationModal: React.FC<GameCreationModalProps> = ({
  isOpen,
  onClose,
  onGameCreate,
  event
}) => {
  const [selectedType, setSelectedType] = useState<GameType>('poll');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentWarning, setContentWarning] = useState('');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const [showResults, setShowResults] = useState(true);

  // Poll-specific state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: '1', text: '', votes: 0 },
    { id: '2', text: '', votes: 0 }
  ]);

  // Trivia-specific state
  const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>([
    {
      id: '1',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      difficulty: 'medium'
    }
  ]);

  // Icebreaker-specific state
  const [icebreakerCategory, setIcebreakerCategory] = useState<'spicy' | 'mild' | 'deep' | 'fun'>('mild');
  const [icebreakerPrompts, setIcebreakerPrompts] = useState<IcebreakerPrompt[]>([
    { id: '1', prompt: '', category: 'mild', responses: {} }
  ]);

  // Bingo-specific state
  const [bingoSize, setBingoSize] = useState<3 | 4 | 5>(5);
  const [bingoItems, setBingoItems] = useState<BingoItem[]>([]);

  const gameTypes = [
    { id: 'poll', name: 'Poll', icon: '📊', description: 'Community voting' },
    { id: 'trivia', name: 'Trivia', icon: '🧠', description: 'Knowledge challenge' },
    { id: 'icebreaker', name: 'Icebreaker', icon: '🔥', description: 'Community connection' },
    { id: 'bingo', name: 'Bingo', icon: '🎯', description: 'Interactive bingo' }
  ];

  // Generate bingo items based on grid size
  React.useEffect(() => {
    const totalItems = bingoSize * bingoSize;
    if (bingoItems.length !== totalItems) {
      const newItems: BingoItem[] = Array.from({ length: totalItems }, (_, index) => ({
        id: String(index + 1),
        text: '',
        marked: false
      }));
      setBingoItems(newItems);
    }
  }, [bingoSize]);

  const addPollOption = () => {
    const newOption: PollOption = {
      id: String(pollOptions.length + 1),
      text: '',
      votes: 0
    };
    setPollOptions([...pollOptions, newOption]);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, text: string) => {
    const updated = [...pollOptions];
    updated[index].text = text;
    setPollOptions(updated);
  };

  const addTriviaQuestion = () => {
    const newQuestion: TriviaQuestion = {
      id: String(triviaQuestions.length + 1),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      difficulty: 'medium'
    };
    setTriviaQuestions([...triviaQuestions, newQuestion]);
  };

  const updateTriviaQuestion = (index: number, field: keyof TriviaQuestion, value: any) => {
    const updated = [...triviaQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setTriviaQuestions(updated);
  };

  const updateTriviaOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...triviaQuestions];
    updated[questionIndex].options[optionIndex] = value;
    setTriviaQuestions(updated);
  };

  const addIcebreakerPrompt = () => {
    const newPrompt: IcebreakerPrompt = {
      id: String(icebreakerPrompts.length + 1),
      prompt: '',
      category: icebreakerCategory,
      responses: {}
    };
    setIcebreakerPrompts([...icebreakerPrompts, newPrompt]);
  };

  const updateIcebreakerPrompt = (index: number, text: string) => {
    const updated = [...icebreakerPrompts];
    updated[index].prompt = text;
    updated[index].category = icebreakerCategory;
    setIcebreakerPrompts(updated);
  };

  const updateBingoItem = (index: number, text: string) => {
    const updated = [...bingoItems];
    updated[index].text = text;
    setBingoItems(updated);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setContentWarning('');
    setTimeLimit('');
    setShowResults(true);
    setPollQuestion('');
    setPollOptions([
      { id: '1', text: '', votes: 0 },
      { id: '2', text: '', votes: 0 }
    ]);
    setTriviaQuestions([{
      id: '1',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      difficulty: 'medium'
    }]);
    setIcebreakerPrompts([{ id: '1', prompt: '', category: 'mild', responses: {} }]);
    setBingoSize(5);
    setBingoItems([]);
  };

  const validateForm = () => {
    if (!title.trim() || !description.trim()) return false;

    switch (selectedType) {
      case 'poll':
        return pollQuestion.trim() && pollOptions.every(opt => opt.text.trim()) && pollOptions.length >= 2;
      case 'trivia':
        return triviaQuestions.every(q => 
          q.question.trim() && 
          q.options.every(opt => opt.trim()) && 
          (q.explanation?.trim() || true)
        );
      case 'icebreaker':
        return icebreakerPrompts.every(p => p.prompt.trim());
      case 'bingo':
        return bingoItems.every(item => item.text.trim());
      default:
        return false;
    }
  };

  const handleCreate = () => {
    if (!validateForm()) return;

    const baseGame = {
      id: `game-${Date.now()}`,
      eventId: event.id,
      staffId: 'current-staff-id', // TODO: Get from auth context
      title,
      description,
      type: selectedType,
      isActive: false,
      participants: [],
      createdAt: new Date(),
      settings: {
        allowOptOut: true,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
        showResults,
        contentWarning: contentWarning || undefined
      }
    };

    let gameData: Game;

    switch (selectedType) {
      case 'poll':
        gameData = {
          ...baseGame,
          type: 'poll',
          question: pollQuestion,
          options: pollOptions,
          allowMultipleChoice: false
        } as Poll;
        break;
      case 'trivia':
        gameData = {
          ...baseGame,
          type: 'trivia',
          questions: triviaQuestions,
          currentQuestionIndex: 0,
          scores: {}
        } as Trivia;
        break;
      case 'icebreaker':
        gameData = {
          ...baseGame,
          type: 'icebreaker',
          category: icebreakerCategory,
          prompts: icebreakerPrompts,
          currentPromptIndex: 0
        } as Icebreaker;
        break;
      case 'bingo':
        gameData = {
          ...baseGame,
          type: 'bingo',
          cells: bingoItems.map(item => ({ ...item, marked: false })),
          winners: []
        } as Bingo;
        break;
      default:
        return;
    }

    onGameCreate(gameData);
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Game</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Game Type Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Game Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {gameTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id as GameType)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedType === type.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-medium text-gray-900 dark:text-white">{type.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Game Info */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Game Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter game title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Describe your game..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Warning
                </label>
                <input
                  type="text"
                  value={contentWarning}
                  onChange={(e) => setContentWarning(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showResults"
                checked={showResults}
                onChange={(e) => setShowResults(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showResults" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Show results to participants
              </label>
            </div>
          </div>

          {/* Poll Configuration */}
          {selectedType === 'poll' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Poll Configuration</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Poll Question
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="What would you like to ask?"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Answer Options
                </label>
                {pollOptions.map((option, index) => (
                  <div key={option.id} className="flex gap-2">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder={`Option ${index + 1}`}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => removePollOption(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addPollOption}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!validateForm()}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                validateForm()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              Create Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCreationModal; 