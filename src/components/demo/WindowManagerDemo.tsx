import React, { useState, useEffect } from 'react'
import { useWindowManager, useSimpleWindow, useWindowMessaging } from '../../hooks/useWindowManager'
import { ManagedWindow, WindowMessage } from '../../utils/windowManager'

interface DemoMessage {
  id: string
  from: string
  type: string
  content: string
  timestamp: number
}

export function WindowManagerDemo() {
  const [messages, setMessages] = useState<DemoMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [selectedWindow, setSelectedWindow] = useState<string>('')
  
  const {
    windows,
    windowCount,
    aliveWindowCount,
    isInitialized,
    openWindow,
    closeWindow,
    closeAllWindows,
    focusWindow,
    sendMessage,
    broadcastMessage,
    onMessage,
    isWindowAlive
  } = useWindowManager({
    onWindowOpened: (window: ManagedWindow) => {
      console.log('Window opened:', window.name)
      addMessage('system', 'window_opened', `Window "${window.name}" opened successfully`)
    },
    onWindowClosed: (windowId: string) => {
      console.log('Window closed:', windowId)
      addMessage('system', 'window_closed', `Window closed: ${windowId}`)
    },
    onWindowFocused: (windowId: string) => {
      console.log('Window focused:', windowId)
      addMessage('system', 'window_focused', `Window focused: ${windowId}`)
    },
    onMessageReceived: (message: WindowMessage) => {
      console.log('Message received:', message)
      addMessage(message.windowId, message.type, JSON.stringify(message.payload))
    },
    onConnectionLost: (windowId: string) => {
      console.log('Connection lost:', windowId)
      addMessage('system', 'connection_lost', `Lost connection to window: ${windowId}`)
    },
    onConnectionRestored: (windowId: string) => {
      console.log('Connection restored:', windowId)
      addMessage('system', 'connection_restored', `Connection restored to window: ${windowId}`)
    }
  })

  const { openGameWindow, openAdminWindow, openPopupWindow } = useSimpleWindow()
  const { broadcastSystemMessage } = useWindowMessaging()

  // Set up message handlers
  useEffect(() => {
    onMessage('demo_message', (message: WindowMessage) => {
      addMessage(message.windowId, 'demo_message', message.payload.text)
    })

    onMessage('ping', (message: WindowMessage) => {
      // Respond to ping with pong
      sendMessage(message.windowId, 'pong', { timestamp: Date.now() })
      addMessage(message.windowId, 'ping', 'Received ping, sent pong')
    })
  }, [onMessage, sendMessage])

  const addMessage = (from: string, type: string, content: string) => {
    const newMessage: DemoMessage = {
      id: Date.now().toString(),
      from,
      type,
      content,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev.slice(-19), newMessage]) // Keep last 20 messages
  }

  const handleOpenDemoWindow = async () => {
    try {
      const demoContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Demo Window</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              margin: 0;
            }
            .container { max-width: 600px; margin: 0 auto; }
            .message-box { 
              background: rgba(255,255,255,0.1); 
              padding: 15px; 
              border-radius: 8px; 
              margin: 10px 0; 
              backdrop-filter: blur(10px);
            }
            button { 
              background: #4CAF50; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 4px; 
              cursor: pointer; 
              margin: 5px;
            }
            button:hover { background: #45a049; }
            input { 
              padding: 8px; 
              margin: 5px; 
              border: none; 
              border-radius: 4px; 
              width: 200px;
            }
            .status { font-size: 0.9em; opacity: 0.8; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Window Manager Demo</h1>
            <div class="message-box">
              <h3>Cross-Window Communication</h3>
              <p>This window can communicate with the parent window!</p>
              <div class="status">Window ID: <span id="windowId">Loading...</span></div>
              <div class="status">Connection Status: <span id="status">Connecting...</span></div>
            </div>

            <div class="message-box">
              <h3>Send Message to Parent</h3>
              <input type="text" id="messageInput" placeholder="Enter message..." value="Hello from child window!">
              <br>
              <button onclick="sendDemoMessage()">Send Message</button>
              <button onclick="sendPing()">Send Ping</button>
            </div>

            <div class="message-box">
              <h3>Window Controls</h3>
              <button onclick="openSibling()">Open Sibling Window</button>
              <button onclick="focusParent()">Focus Parent</button>
              <button onclick="window.close()">Close This Window</button>
            </div>

            <div class="message-box">
              <h3>Message Log</h3>
              <div id="messageLog" style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px;">
                <div>Waiting for messages...</div>
              </div>
            </div>
          </div>

          <script>
            let windowId = 'unknown';
            let parentWindow = window.opener;

            // Listen for messages from parent
            window.addEventListener('message', (event) => {
              console.log('Child window received message:', event.data);
              
              if (event.data.type === 'window_initialize') {
                windowId = event.data.windowId;
                document.getElementById('windowId').textContent = windowId;
                document.getElementById('status').textContent = 'Connected';
                
                // Send registration confirmation
                parentWindow.postMessage({
                  type: 'window_register',
                  windowId: windowId,
                  payload: { status: 'ready' },
                  timestamp: Date.now(),
                  messageId: 'reg_' + Date.now()
                }, '*');
                
                addToLog('✅ Connected to parent window');
              } else if (event.data.type === 'pong') {
                addToLog('🏓 Received pong from parent');
              } else {
                addToLog('📩 ' + event.data.type + ': ' + JSON.stringify(event.data.payload));
              }
            });

            function sendDemoMessage() {
              const input = document.getElementById('messageInput');
              const message = {
                type: 'demo_message',
                windowId: windowId,
                payload: { text: input.value },
                timestamp: Date.now(),
                messageId: 'demo_' + Date.now()
              };
              
              parentWindow.postMessage(message, '*');
              addToLog('📤 Sent: ' + input.value);
              input.value = '';
            }

            function sendPing() {
              const message = {
                type: 'ping',
                windowId: windowId,
                payload: { timestamp: Date.now() },
                timestamp: Date.now(),
                messageId: 'ping_' + Date.now()
              };
              
              parentWindow.postMessage(message, '*');
              addToLog('🏓 Sent ping');
            }

            function openSibling() {
              // This would open another window - for demo purposes
              addToLog('🔗 Would open sibling window (not implemented in demo)');
            }

            function focusParent() {
              if (parentWindow && !parentWindow.closed) {
                parentWindow.focus();
                addToLog('👁️ Focused parent window');
              }
            }

            function addToLog(message) {
              const log = document.getElementById('messageLog');
              const timestamp = new Date().toLocaleTimeString();
              log.innerHTML += '<div>' + timestamp + ' - ' + message + '</div>';
              log.scrollTop = log.scrollHeight;
            }

            // Send heartbeat every 3 seconds
            setInterval(() => {
              if (parentWindow && !parentWindow.closed) {
                parentWindow.postMessage({
                  type: 'heartbeat',
                  windowId: windowId,
                  payload: { timestamp: Date.now() },
                  timestamp: Date.now(),
                  messageId: 'heartbeat_' + Date.now()
                }, '*');
              }
            }, 3000);

            // Handle window close
            window.addEventListener('beforeunload', () => {
              if (parentWindow && !parentWindow.closed) {
                parentWindow.postMessage({
                  type: 'window_closing',
                  windowId: windowId,
                  payload: { reason: 'user_closed' },
                  timestamp: Date.now(),
                  messageId: 'close_' + Date.now()
                }, '*');
              }
            });

            addToLog('🚀 Demo window initialized');
          </script>
        </body>
        </html>
      `

      const blob = new Blob([demoContent], { type: 'text/html' })
      const demoUrl = URL.createObjectURL(blob)

      await openWindow({
        url: demoUrl,
        name: `demo_window_${Date.now()}`,
        features: {
          width: 700,
          height: 600,
          resizable: true,
          scrollbars: true
        },
        data: { type: 'demo', createdAt: Date.now() }
      })
    } catch (error) {
      console.error('Failed to open demo window:', error)
      addMessage('system', 'error', `Failed to open demo window: ${error}`)
    }
  }

  const handleOpenGameWindow = async () => {
    const gameWindow = await openGameWindow('demo-game', { level: 1, player: 'demo' })
    if (gameWindow) {
      addMessage('system', 'game_window_opened', `Game window opened: ${gameWindow.id}`)
    }
  }

  const handleOpenAdminWindow = async () => {
    const adminWindow = await openAdminWindow('users')
    if (adminWindow) {
      addMessage('system', 'admin_window_opened', `Admin window opened: ${adminWindow.id}`)
    }
  }

  const handleSendMessage = () => {
    if (!selectedWindow || !messageInput.trim()) return

    const success = sendMessage(selectedWindow, 'demo_message', { text: messageInput })
    if (success) {
      addMessage('main', 'demo_message', `Sent to ${selectedWindow}: ${messageInput}`)
      setMessageInput('')
    } else {
      addMessage('system', 'error', `Failed to send message to ${selectedWindow}`)
    }
  }

  const handleBroadcastMessage = () => {
    if (!messageInput.trim()) return

    const count = broadcastSystemMessage(messageInput, 'medium')
    addMessage('main', 'broadcast', `Broadcasted to ${count} windows: ${messageInput}`)
    setMessageInput('')
  }

  const clearMessages = () => setMessages([])

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Initializing Window Manager...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          🪟 Window Management System Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Total Windows</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{windowCount}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100">Alive Windows</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{aliveWindowCount}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100">System Status</h3>
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
              {isInitialized ? '✅ Ready' : '⏳ Initializing'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Window Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Window Controls</h2>
          
          <div className="space-y-3">
            <button
              onClick={handleOpenDemoWindow}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🚀 Open Demo Window
            </button>
            
            <button
              onClick={handleOpenGameWindow}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🎮 Open Game Window
            </button>
            
            <button
              onClick={handleOpenAdminWindow}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ⚙️ Open Admin Window
            </button>
            
            <button
              onClick={() => openPopupWindow('https://example.com', 'example')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🌐 Open External Popup
            </button>
            
            <button
              onClick={closeAllWindows}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              disabled={windowCount === 0}
            >
              ❌ Close All Windows
            </button>
          </div>
        </div>

        {/* Window List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Active Windows</h2>
          
          {windows.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">No windows open</p>
          ) : (
            <div className="space-y-2">
              {windows.map((window) => (
                <div
                  key={window.id}
                  className={`p-3 rounded-lg border ${
                    isWindowAlive(window.id)
                      ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                      : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {window.name}
                        {isWindowAlive(window.id) ? (
                          <span className="ml-2 text-green-600 dark:text-green-400">🟢</span>
                        ) : (
                          <span className="ml-2 text-red-600 dark:text-red-400">🔴</span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {window.id.slice(-8)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Created: {new Date(window.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => focusWindow(window.id)}
                        className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-sm"
                        disabled={!isWindowAlive(window.id)}
                      >
                        Focus
                      </button>
                      <button
                        onClick={() => closeWindow(window.id)}
                        className="bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-300 px-2 py-1 rounded text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messaging Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Cross-Window Messaging</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Target Window
              </label>
              <select
                value={selectedWindow}
                onChange={(e) => setSelectedWindow(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a window...</option>
                {windows.filter(w => isWindowAlive(w.id)).map((window) => (
                  <option key={window.id} value={window.id}>
                    {window.name} ({window.id.slice(-8)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && selectedWindow && handleSendMessage()}
                placeholder="Enter your message..."
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleSendMessage}
                disabled={!selectedWindow || !messageInput.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Send to Selected
              </button>
              <button
                onClick={handleBroadcastMessage}
                disabled={!messageInput.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Broadcast to All
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Message Log</h3>
              <button
                onClick={clearMessages}
                className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded"
              >
                Clear
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 h-64 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic">No messages yet...</p>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div key={message.id} className="text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`font-medium ${
                          message.from === 'system' ? 'text-blue-600 dark:text-blue-400' :
                          message.from === 'main' ? 'text-green-600 dark:text-green-400' :
                          'text-purple-600 dark:text-purple-400'
                        }`}>
                          {message.from}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600 dark:text-gray-300 font-mono text-xs">
                          {message.type}
                        </span>
                      </div>
                      <div className="text-gray-900 dark:text-white ml-4">
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 