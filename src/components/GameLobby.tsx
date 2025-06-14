import React, { useState, useMemo } from 'react'
import { GameRoom, GameType, LobbyFilters, CreateRoomData } from '../types/game'
import { useGameLobby, useQuickJoin } from '../hooks/useGameLobby'
import { useGuestUser } from '../hooks/useGuestUser'

interface GameLobbyProps {
  onJoinRoom?: (roomId: string) => void
  onCreateRoom?: (room: GameRoom) => void
  className?: string
}

export default function GameLobby({ onJoinRoom, onCreateRoom, className = '' }: GameLobbyProps) {
  const { currentUser } = useGuestUser()
  const [filters, setFilters] = useState<LobbyFilters>({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const { 
    rooms, 
    gameTypes, 
    stats, 
    loading, 
    error, 
    userRoom,
    createRoom, 
    joinRoom,
    refreshLobby 
  } = useGameLobby(filters)

  const { quickJoinRoom, loading: quickJoinLoading } = useQuickJoin()

  const handleJoinRoom = async (roomId: string, password?: string) => {
    const result = await joinRoom({ roomId, password })
    if (result.success && result.room) {
      onJoinRoom?.(roomId)
    }
  }

  const handleCreateRoom = async (data: CreateRoomData) => {
    const result = await createRoom(data)
    if (result.success && result.room) {
      setShowCreateForm(false)
      onCreateRoom?.(result.room)
    }
  }

  const handleQuickJoin = async (gameTypeId?: string) => {
    const result = await quickJoinRoom(gameTypeId)
    if (result.success && result.room) {
      onJoinRoom?.(result.room.id)
    }
  }

  if (!currentUser) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Login Required</h3>
          <p className="text-yellow-700">Please enter a nickname to access the game lobby.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Game Lobby</h2>
          <p className="text-gray-600">Welcome, {currentUser.nickname}!</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshLobby}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Create Room
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Current Room Alert */}
      {userRoom && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-blue-800">You're currently in a room</h3>
              <p className="text-blue-700">{userRoom.name} - {userRoom.gameTypeName}</p>
            </div>
            <button
              onClick={() => onJoinRoom?.(userRoom.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Room
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{stats.totalRooms}</div>
            <div className="text-sm text-gray-600">Total Rooms</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{stats.activeGames}</div>
            <div className="text-sm text-gray-600">Active Games</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-yellow-600">{stats.waitingRooms}</div>
            <div className="text-sm text-gray-600">Waiting Rooms</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">{stats.totalPlayers}</div>
            <div className="text-sm text-gray-600">Total Players</div>
          </div>
        </div>
      )}

      {/* Quick Join */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Join</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {gameTypes.map(gameType => (
            <button
              key={gameType.id}
              onClick={() => handleQuickJoin(gameType.id)}
              disabled={quickJoinLoading}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-center"
            >
              <div className="text-2xl mb-1">{gameType.icon}</div>
              <div className="text-xs font-medium">{gameType.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Room List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Available Rooms ({rooms.length})</h3>
        
        {rooms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎮</div>
            <p>No rooms available.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              Create the first room!
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map(room => {
              const gameType = gameTypes.find(gt => gt.id === room.gameTypeId)
              const canJoin = room.currentPlayers < room.maxPlayers && ['waiting', 'starting'].includes(room.status)
              
              return (
                <div key={room.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{gameType?.icon}</span>
                        <h4 className="font-semibold text-gray-900">{room.name}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
                          {room.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{room.description || gameType?.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>👥 {room.currentPlayers}/{room.maxPlayers}</span>
                        <span>🎯 {gameType?.name}</span>
                        <span>⏱️ ~{gameType?.estimatedDuration}min</span>
                        {room.meetupLocation && <span>📍 {room.meetupLocation}</span>}
                        {room.meetupTime && <span>🕐 {new Date(room.meetupTime).toLocaleTimeString()}</span>}
                        {room.isPasswordProtected && <span>🔒 Private</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={!canJoin}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          canJoin
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {canJoin ? 'Join' : 'Full'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Players */}
                  <div className="flex flex-wrap gap-2">
                    {room.players.map(player => (
                      <div
                        key={player.userId}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: player.color }}
                        ></div>
                        <span>{player.nickname}</span>
                        {player.isHost && <span className="text-yellow-600">👑</span>}
                        {player.isReady && <span className="text-green-600">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateForm && (
        <CreateRoomModal
          gameTypes={gameTypes}
          onCreateRoom={handleCreateRoom}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  )
}

// Create Room Modal Component
interface CreateRoomModalProps {
  gameTypes: GameType[]
  onCreateRoom: (data: CreateRoomData) => void
  onClose: () => void
}

function CreateRoomModal({ gameTypes, onCreateRoom, onClose }: CreateRoomModalProps) {
  const [formData, setFormData] = useState<CreateRoomData>({
    gameTypeId: '',
    name: '',
    description: '',
    privacy: 'public',
    password: '',
    maxPlayers: undefined,
    meetupLocation: '',
    meetupTime: undefined,
    meetupNotes: '',
    settings: {
      allowSpectators: true,
      autoStart: false,
      autoStartDelay: 10,
      maxSpectators: 5
    }
  })

  const selectedGameType = gameTypes.find(gt => gt.id === formData.gameTypeId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.gameTypeId || !formData.name.trim()) return
    
    onCreateRoom({
      ...formData,
      name: formData.name.trim(),
      description: formData.description?.trim(),
      password: formData.privacy === 'private' ? formData.password : undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Create New Room</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Type *</label>
              <select
                value={formData.gameTypeId}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  gameTypeId: e.target.value,
                  maxPlayers: gameTypes.find(gt => gt.id === e.target.value)?.maxPlayers
                }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a game</option>
                {gameTypes.map(gameType => (
                  <option key={gameType.id} value={gameType.id}>
                    {gameType.icon} {gameType.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter room name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
              <select
                value={formData.privacy}
                onChange={(e) => setFormData(prev => ({ ...prev, privacy: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="public">Public</option>
                <option value="private">Private (Password Protected)</option>
              </select>
            </div>

            {formData.privacy === 'private' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password"
                />
              </div>
            )}

            {/* Meetup Details for Physical Games */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">📍 Meetup Details (for in-person games)</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Location</label>
                <input
                  type="text"
                  value={formData.meetupLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, meetupLocation: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Coffee shop on Main St, My apartment, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <input
                  type="datetime-local"
                  value={formData.meetupTime ? new Date(formData.meetupTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    meetupTime: e.target.value ? new Date(e.target.value).getTime() : undefined 
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={formData.meetupNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, meetupNotes: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Any special instructions, what to bring, etc."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 