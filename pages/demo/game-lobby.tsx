// Demo page for Game Lobby and Room Management System
import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import GameLobby from '../../src/components/GameLobby'
import GameRoom from '../../src/components/GameRoom'
import NicknameEntry from '../../src/components/NicknameEntry'
import { useGuestUser } from '../../src/hooks/useGuestUser'

type ViewMode = 'lobby' | 'room'

export default function GameLobbyDemo() {
  const router = useRouter()
  const { currentUser } = useGuestUser()
  const [viewMode, setViewMode] = useState<ViewMode>('lobby')
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)

  const handleJoinRoom = (roomId: string) => {
    setCurrentRoomId(roomId)
    setViewMode('room')
  }

  const handleLeaveRoom = () => {
    setCurrentRoomId(null)
    setViewMode('lobby')
  }

  const handleGameStart = (roomId: string) => {
    // In a real app, this would navigate to the actual game
    alert(`Game started in room ${roomId}! In a real app, this would launch the game.`)
  }

  return (
    <>
      <Head>
        <title>Game Lobby Demo - Sucia MVP</title>
        <meta name="description" content="Demo of the game lobby and room management system" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to Home
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-xl font-semibold text-gray-900">Game Lobby Demo</h1>
              </div>
              
              {currentUser && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: currentUser.color }}
                    >
                      {currentUser.nickname.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700">{currentUser.nickname}</span>
                  </div>
                  
                  {viewMode === 'room' && (
                    <button
                      onClick={handleLeaveRoom}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Return to Lobby
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!currentUser ? (
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">🎮</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Game Lobby</h2>
                  <p className="text-gray-600">Enter a nickname to start playing games with others!</p>
                </div>
                <NicknameEntry />
              </div>
              
              {/* Demo Info */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-800 mb-3">🎯 Demo Features</h3>
                <ul className="text-blue-700 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Game Lobby:</strong> Browse and join available game rooms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Room Creation:</strong> Create custom game rooms with different settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Quick Join:</strong> Instantly join or create rooms for specific games</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Room Management:</strong> Host controls, player ready states, game starting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Real-time Updates:</strong> Live player status and room changes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Multiple Game Types:</strong> Uno, Poker, Trivia, Charades, Chess</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'lobby' && (
                <GameLobby
                  onJoinRoom={handleJoinRoom}
                  onCreateRoom={(room) => handleJoinRoom(room.id)}
                />
              )}
              
              {viewMode === 'room' && currentRoomId && (
                <GameRoom
                  roomId={currentRoomId}
                  onLeaveRoom={handleLeaveRoom}
                  onGameStart={handleGameStart}
                />
              )}
            </>
          )}
        </div>

        {/* Footer Info */}
        {currentUser && (
          <div className="bg-white border-t mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-gray-600">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🎮 Game Types Available</h4>
                  <ul className="space-y-1">
                    <li>🎴 Uno - Classic card matching game</li>
                    <li>♠️ Texas Hold'em Poker - Strategic card game</li>
                    <li>🧠 Trivia Challenge - Knowledge competition</li>
                    <li>🎭 Charades - Acting and guessing game</li>
                    <li>♟️ Chess - Strategic board game</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🚀 How to Play</h4>
                  <ul className="space-y-1">
                    <li>1. Browse available rooms or create your own</li>
                    <li>2. Join a room that interests you</li>
                    <li>3. Wait for other players and mark yourself ready</li>
                    <li>4. Host starts the game when everyone is ready</li>
                    <li>5. Enjoy playing with others!</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">⚡ Features</h4>
                  <ul className="space-y-1">
                    <li>✅ Real-time room updates</li>
                    <li>✅ Password-protected private rooms</li>
                    <li>✅ Customizable room settings</li>
                    <li>✅ Player ready status tracking</li>
                    <li>✅ Host controls and management</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-500 text-sm">
                  This is a demo of the Game Lobby and Room Management system. 
                  Data is stored locally and will reset when you refresh the page.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
} 