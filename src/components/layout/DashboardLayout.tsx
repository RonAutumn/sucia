import React, { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { 
  LayoutDashboard, 
  Gamepad2, 
  Users, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  Bell,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import SuciaLogo from './SuciaLogo'
import { ThemeToggle } from './ThemeToggle'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Games', href: '/games', icon: Gamepad2 },
  { name: 'Services', href: '/services', icon: ClipboardList },
  { name: 'Check-ins', href: '/checkins', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-200">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-neutral-900/50 dark:bg-neutral-900/75 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 
        shadow-lg transform transition-all duration-300 ease-in-out 
        lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200 dark:border-neutral-700">
          <SuciaLogo size="medium" showText={true} />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
                  transition-all duration-200 ease-in-out
                  ${isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 shadow-sm'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 hover:shadow-sm'
                  }
                `}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white text-sm font-medium">S</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                Sucia Admin
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                admin@sucianyc.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen bg-neutral-50 dark:bg-neutral-950">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700 transition-colors duration-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              {title && (
                <h1 className="ml-4 lg:ml-0 text-2xl font-semibold text-neutral-900 dark:text-white transition-colors">
                  {title}
                </h1>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <button className="relative p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-error-500 transform translate-x-1 -translate-y-1 shadow-sm" />
              </button>

              {/* System status */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full transition-colors">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="bg-neutral-50 dark:bg-neutral-950 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
} 