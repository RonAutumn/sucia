// Game Room Component - Interface for players inside a game room
import React, { useState } from 'react'
import { GameRoom as GameRoomType } from '../types/game'
import { useGameRoom, useRoomUtils } from '../hooks/useGameLobby'
import { useGuestUser } from '../hooks/useGuestUser'

interface GameRoomProps {
  roomId: string
  onLeaveRoom?: () => void
  onGameStart?: (roomId: string) => void
  className?: string
}

export default function GameRoom({ roomId, onLeaveRoom, onGameStart, className = '' }: GameRoomProps) {
  const { currentUser } = useGuestUser()
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const {
    room,
    loading,
    error,
    isUserInRoom,
    currentPlayer,
    isHost,
    allPlayersReady,
    hasMinPlayers,
    isFull,
    leaveRoom,
    deleteRoom,
    setPlayerReady,
    startGame
  } = useGameRoom(roomId)

  const { getGameTypeById } = useRoomUtils()

  const gameType = room ? getGameTypeById(room.gameTypeId) : null

  const handleLeaveRoom = async () => {
    const result = await leaveRoom()
    if (result.success) {
      setShowLeaveConfirm(false)
      onLeaveRoom?.()
    }
  }

  const handleDeleteRoom = async () => {
    const result = await deleteRoom()
    if (result.success) {
      setShowDeleteConfirm(false)
      onLeaveRoom?.()
    }
  }

  const handleToggleReady = async () => {
    if (!currentPlayer) return
    await setPlayerReady(!currentPlayer.isReady)
  }

  const handleStartGame = async () => {
    const result = await startGame()
    if (result.success) {
      onGameStart?.(roomId)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'starting': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlayerStatusIcon = (player: any) => {
    if (player.status === 'disconnected') return '🔴'
    if (player.status === 'away') return '🟡'
    if (player.isReady) return '✅'
    return '⏳'
  }

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Room Not Found</h3>
          <p className="text-red-700">The room you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={onLeaveRoom}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    )
  }

  if (!isUserInRoom) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Not in Room</h3>
          <p className="text-yellow-700">You are not a member of this room.</p>
          <button
            onClick={onLeaveRoom}
            className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{gameType?.icon}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
                <p className="text-gray-600">{gameType?.name}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(room.status)}`}>
                {room.status}
              </span>
            </div>
            {room.description && (
              <p className="text-gray-700 mb-3">{room.description}</p>
            )}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>👥 {room.currentPlayers}/{room.maxPlayers} players</span>
              <span>⏱️ ~{gameType?.estimatedDuration} minutes</span>
              <span>🎯 {gameType?.difficulty} difficulty</span>
              {room.isPasswordProtected && <span>🔒 Private room</span>}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Leave Room
            </button>
            {isHost && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Delete Room
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Meetup Information */}
        {(room.meetupLocation || room.meetupTime || room.meetupNotes) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-800 mb-2">📍 Meetup Details</h3>
            {room.meetupLocation && (
              <div className="text-sm text-green-700 mb-1">
                <strong>Location:</strong> {room.meetupLocation}
              </div>
            )}
            {room.meetupTime && (
              <div className="text-sm text-green-700 mb-1">
                <strong>Time:</strong> {new Date(room.meetupTime).toLocaleString()}
              </div>
            )}
            {room.meetupNotes && (
              <div className="text-sm text-green-700">
                <strong>Notes:</strong> {room.meetupNotes}
              </div>
            )}
          </div>
        )}

        {/* What to Bring */}
        {gameType?.requirements && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-orange-800 mb-2">🎒 What to Bring</h3>
            <ul className="text-orange-700 text-sm space-y-1">
              {gameType.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Game Rules */}
        {gameType?.rules && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Game Rules</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              {gameType.rules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Players */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Players ({room.currentPlayers}/{room.maxPlayers})
          </h2>
          {room.status === 'waiting' && (
            <div className="text-sm text-gray-500">
              {hasMinPlayers ? (
                allPlayersReady ? (
                  <span className="text-green-600">✅ All players ready!</span>
                ) : (
                  <span>Waiting for players to ready up...</span>
                )
              ) : (
                <span>Need {room.minPlayers - room.currentPlayers} more player(s)</span>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {room.players.map(player => (
            <div
              key={player.userId}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                player.userId === currentUser?.id 
                  ? 'border-blue-200 bg-blue-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: player.color }}
                >
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{player.nickname}</span>
                    {player.isHost && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                        👑 Host
                      </span>
                    )}
                    {player.userId === currentUser?.id && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Joined {new Date(player.joinedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <span>{getPlayerStatusIcon(player)}</span>
                    <span className="text-gray-600">
                      {player.isReady ? 'Ready' : 'Not Ready'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {player.status === 'connected' ? 'Online' : player.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {room.status === 'waiting' && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          
          <div className="flex gap-4">
            {/* Ready Toggle */}
            <button
              onClick={handleToggleReady}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                currentPlayer?.isReady
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {currentPlayer?.isReady ? '✅ Ready' : '⏳ Not Ready'}
            </button>

            {/* Start Game (Host Only) */}
            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!hasMinPlayers || !allPlayersReady}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                  hasMinPlayers && allPlayersReady
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                🚀 Start Game
              </button>
            )}
          </div>

          {/* Start Game Requirements */}
          {isHost && (!hasMinPlayers || !allPlayersReady) && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm font-medium">Requirements to start:</p>
              <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                <li className="flex items-center gap-2">
                  <span className={hasMinPlayers ? '✅' : '❌'}></span>
                  <span>Minimum {room.minPlayers} players ({room.currentPlayers}/{room.minPlayers})</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={allPlayersReady ? '✅' : '❌'}></span>
                  <span>All players ready ({room.players.filter(p => p.isReady).length}/{room.currentPlayers})</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Game Status */}
      {room.status === 'starting' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">🚀</div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Game Starting!</h3>
          <p className="text-blue-700">Get ready to play {gameType?.name}...</p>
        </div>
      )}

      {room.status === 'active' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">🎮</div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">Game in Progress</h3>
          <p className="text-green-700">The game is currently active!</p>
        </div>
      )}

      {/* Leave Room Confirmation */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Leave Room?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to leave this room? You'll need to rejoin to continue playing.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveRoom}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Delete Room?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this room? This action cannot be undone and all players will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 