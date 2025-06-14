// React hooks for Game Lobby Management
import { useState, useEffect, useCallback } from 'react'
import { 
  GameRoom, 
  GameType, 
  CreateRoomData, 
  JoinRoomData, 
  LobbyFilters, 
  LobbyStats,
  RoomPlayer
} from '../types/game'
import { getGameLobbyManager } from '../utils/gameLobbyManager'
import { useGuestUser } from './useGuestUser'

// Main lobby hook for managing all rooms
export function useGameLobby(filters?: LobbyFilters) {
  const [rooms, setRooms] = useState<GameRoom[]>([])
  const [gameTypes, setGameTypes] = useState<GameType[]>([])
  const [stats, setStats] = useState<LobbyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentUser } = useGuestUser()

  const lobbyManager = getGameLobbyManager()

  // Load initial data
  useEffect(() => {
    try {
      const allRooms = lobbyManager.getAllRooms(filters)
      const allGameTypes = lobbyManager.getGameTypes()
      const lobbyStats = lobbyManager.getLobbyStats()
      
      setRooms(allRooms)
      setGameTypes(allGameTypes)
      setStats(lobbyStats)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lobby data')
      setLoading(false)
    }
  }, [filters])

  // Subscribe to lobby updates
  useEffect(() => {
    const unsubscribe = lobbyManager.subscribeToLobbyUpdates((updatedRooms) => {
      const filteredRooms = filters ? 
        updatedRooms.filter(room => {
          if (filters.gameType && room.gameTypeId !== filters.gameType) return false
          if (filters.status && !filters.status.includes(room.status)) return false
          if (filters.privacy && !filters.privacy.includes(room.privacy)) return false
          if (filters.hasSpace && room.currentPlayers >= room.maxPlayers) return false
          return true
        }) : updatedRooms

      setRooms(filteredRooms)
      setStats(lobbyManager.getLobbyStats())
    })

    return unsubscribe
  }, [filters])

  const createRoom = useCallback(async (data: CreateRoomData) => {
    try {
      setError(null)
      const room = await lobbyManager.createRoom(data)
      return { success: true, room }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [])

  const joinRoom = useCallback(async (data: JoinRoomData) => {
    try {
      setError(null)
      return await lobbyManager.joinRoom(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [])

  const refreshLobby = useCallback(() => {
    try {
      const allRooms = lobbyManager.getAllRooms(filters)
      const lobbyStats = lobbyManager.getLobbyStats()
      setRooms(allRooms)
      setStats(lobbyStats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh lobby')
    }
  }, [filters])

  // Get user's current room
  const userRoom = currentUser ? lobbyManager.getUserRoom(currentUser.id) : null

  return {
    rooms,
    gameTypes,
    stats,
    loading,
    error,
    userRoom,
    createRoom,
    joinRoom,
    refreshLobby
  }
}

// Hook for managing a specific room
export function useGameRoom(roomId: string | null) {
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentUser } = useGuestUser()

  const lobbyManager = getGameLobbyManager()

  // Load room data
  useEffect(() => {
    if (!roomId) {
      setRoom(null)
      setLoading(false)
      return
    }

    try {
      const roomData = lobbyManager.getRoom(roomId)
      setRoom(roomData)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room')
      setLoading(false)
    }
  }, [roomId])

  // Subscribe to room updates
  useEffect(() => {
    if (!roomId) return

    const unsubscribe = lobbyManager.subscribeToRoomUpdates(roomId, (updatedRoom) => {
      setRoom(updatedRoom)
    })

    return unsubscribe
  }, [roomId])

  const leaveRoom = useCallback(async () => {
    if (!roomId) return { success: false, error: 'No room to leave' }

    try {
      setError(null)
      await lobbyManager.leaveRoom(roomId)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave room'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [roomId])

  const deleteRoom = useCallback(async () => {
    if (!roomId) return { success: false, error: 'No room to delete' }

    try {
      setError(null)
      await lobbyManager.deleteRoom(roomId)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete room'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [roomId])

  const setPlayerReady = useCallback(async (isReady: boolean) => {
    if (!roomId) return { success: false, error: 'No room available' }

    try {
      setError(null)
      await lobbyManager.setPlayerReady(roomId, isReady)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set ready status'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [roomId])

  const startGame = useCallback(async () => {
    if (!roomId) return { success: false, error: 'No room available' }

    try {
      setError(null)
      await lobbyManager.startGame(roomId)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start game'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [roomId])

  // Check if current user is in this room
  const isUserInRoom = room && currentUser ? 
    room.players.some(p => p.userId === currentUser.id) : false

  // Get current user's player data
  const currentPlayer = room && currentUser ? 
    room.players.find(p => p.userId === currentUser.id) : null

  // Check if user is host
  const isHost = currentPlayer?.isHost || false

  // Check if all players are ready
  const allPlayersReady = room ? room.players.every(p => p.isReady) : false

  // Check if room has minimum players
  const hasMinPlayers = room ? room.players.length >= room.minPlayers : false

  // Check if room is full
  const isFull = room ? room.currentPlayers >= room.maxPlayers : false

  return {
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
  }
}

// Hook for quick room joining/creation
export function useQuickJoin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { currentUser } = useGuestUser()

  const lobbyManager = getGameLobbyManager()

  const quickJoinRoom = useCallback(async (gameTypeId?: string) => {
    if (!currentUser) {
      setError('Must be logged in to join a room')
      return { success: false, error: 'Must be logged in to join a room' }
    }

    setLoading(true)
    setError(null)

    try {
      // Find available rooms
      const filters: LobbyFilters = {
        status: ['waiting'],
        hasSpace: true
      }
      
      if (gameTypeId) {
        filters.gameType = gameTypeId
      }

      const availableRooms = lobbyManager.getAllRooms(filters)
      
      if (availableRooms.length > 0) {
        // Join the first available room
        const result = await lobbyManager.joinRoom({ roomId: availableRooms[0].id })
        setLoading(false)
        return result
      } else {
        // No rooms available, create a new one
        if (!gameTypeId) {
          setLoading(false)
          setError('No rooms available and no game type specified for creating new room')
          return { success: false, error: 'No rooms available and no game type specified' }
        }

        const gameTypes = lobbyManager.getGameTypes()
        const gameType = gameTypes.find(gt => gt.id === gameTypeId)
        
        if (!gameType) {
          setLoading(false)
          setError('Invalid game type')
          return { success: false, error: 'Invalid game type' }
        }

        const room = await lobbyManager.createRoom({
          gameTypeId,
          name: `${currentUser.nickname}'s ${gameType.name} Game`,
          privacy: 'public'
        })

        setLoading(false)
        return { success: true, room }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join or create room'
      setError(errorMessage)
      setLoading(false)
      return { success: false, error: errorMessage }
    }
  }, [currentUser])

  return {
    quickJoinRoom,
    loading,
    error
  }
}

// Hook for room utilities
export function useRoomUtils() {
  const lobbyManager = getGameLobbyManager()

  const canJoinRoom = useCallback((roomId: string, userId: string) => {
    return lobbyManager.canJoinRoom(roomId, userId)
  }, [])

  const isRoomFull = useCallback((roomId: string) => {
    return lobbyManager.isRoomFull(roomId)
  }, [])

  const getRoomPlayerCount = useCallback((roomId: string) => {
    return lobbyManager.getRoomPlayerCount(roomId)
  }, [])

  const getGameTypeById = useCallback((gameTypeId: string) => {
    const gameTypes = lobbyManager.getGameTypes()
    return gameTypes.find(gt => gt.id === gameTypeId) || null
  }, [])

  return {
    canJoinRoom,
    isRoomFull,
    getRoomPlayerCount,
    getGameTypeById
  }
} 