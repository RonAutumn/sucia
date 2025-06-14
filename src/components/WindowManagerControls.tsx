import React from 'react'
import { useSimpleWindow } from '../hooks/useWindowManager'

interface WindowManagerControlsProps {
  className?: string
  showLabels?: boolean
}

export function WindowManagerControls({ 
  className = '',
  showLabels = true 
}: WindowManagerControlsProps) {
  const { openGameWindow, openAdminWindow, openPopupWindow } = useSimpleWindow()

  const handleOpenDemo = () => {
    openPopupWindow('/demo/window-manager', 'window_manager_demo', 1200, 800)
  }

  const handleOpenGameDemo = () => {
    openGameWindow('demo', { type: 'demo', mode: 'tutorial' })
  }

  const handleOpenAdminDemo = () => {
    openAdminWindow('dashboard')
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        onClick={handleOpenDemo}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        title="Open Window Manager Demo"
      >
        <span>🪟</span>
        {showLabels && <span>Window Demo</span>}
      </button>

      <button
        onClick={handleOpenGameDemo}
        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        title="Open Game in New Window"
      >
        <span>🎮</span>
        {showLabels && <span>Game Window</span>}
      </button>

      <button
        onClick={handleOpenAdminDemo}
        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        title="Open Admin Panel in New Window"
      >
        <span>⚙️</span>
        {showLabels && <span>Admin Window</span>}
      </button>
    </div>
  )
}

export default WindowManagerControls 