import React, { useState, useRef, useEffect } from 'react'
import { useGuestUser } from '../hooks/useGuestUser'

interface NicknameEntryProps {
  onJoined?: (nickname: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  showWelcome?: boolean
}

export function NicknameEntry({ 
  onJoined,
  placeholder = "Enter your nickname...",
  className = "",
  autoFocus = true,
  showWelcome = true
}: NicknameEntryProps) {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { joinAsGuest, validateNickname, isJoined } = useGuestUser()

  useEffect(() => {
    if (autoFocus && inputRef.current && !isJoined) {
      inputRef.current.focus()
    }
  }, [autoFocus, isJoined])

  const handleNicknameChange = (value: string) => {
    setNickname(value)
    setError('')
    setSuggestion('')

    // Real-time validation
    if (value.trim()) {
      const validation = validateNickname(value)
      if (!validation.isValid) {
        setError(validation.error || '')
        if (validation.suggestion) {
          setSuggestion(validation.suggestion)
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nickname.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError('')
    setSuggestion('')

    try {
      const result = await joinAsGuest(nickname.trim())
      
      if (result.success && result.user) {
        console.log('Successfully joined as:', result.user.nickname)
        if (onJoined) {
          onJoined(result.user.nickname)
        }
      } else {
        setError(result.error || 'Failed to join')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error('Join error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUseSuggestion = () => {
    if (suggestion) {
      setNickname(suggestion)
      setSuggestion('')
      setError('')
      inputRef.current?.focus()
    }
  }

  // Don't render if already joined
  if (isJoined) {
    return null
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {showWelcome && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a nickname to join the game
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              placeholder={placeholder}
              className={`w-full px-4 py-3 text-lg border-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error 
                  ? 'border-red-300 bg-red-50 dark:border-red-500 dark:bg-red-900/10' 
                  : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
              } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
              disabled={isSubmitting}
              maxLength={20}
              autoComplete="off"
              spellCheck={false}
            />
            {isSubmitting && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Character count */}
          <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-gray-500">
              {nickname.length}/20 characters
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400 flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                {error}
              </p>
              
              {/* Suggestion */}
              {suggestion && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleUseSuggestion}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                  >
                    Try "{suggestion}" instead?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Validation hints */}
          {!error && nickname && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span className={`flex items-center ${nickname.length >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                  {nickname.length >= 2 ? '✓' : '•'} At least 2 characters
                </span>
                <span className={`flex items-center ${/^[a-zA-Z0-9\s_-]+$/.test(nickname) ? 'text-green-600' : 'text-gray-400'}`}>
                  {/^[a-zA-Z0-9\s_-]+$/.test(nickname) ? '✓' : '•'} Valid characters only
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!nickname.trim() || !!error || isSubmitting}
          className={`w-full py-3 px-6 text-lg font-medium rounded-lg transition-all duration-200 ${
            !nickname.trim() || !!error || isSubmitting
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Joining...
            </span>
          ) : (
            'Join Game 🎮'
          )}
        </button>
      </form>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          💡 Tips:
        </h3>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Choose something unique that others will recognize you by</li>
          <li>• You can use letters, numbers, spaces, underscores, and hyphens</li>
          <li>• Your nickname will be displayed on the main TV screen</li>
        </ul>
      </div>
    </div>
  )
}

export default NicknameEntry 