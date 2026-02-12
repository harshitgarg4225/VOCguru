'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Lightbulb, 
  Users, 
  Bell, 
  Globe, 
  Settings,
  LogOut,
  ChevronLeft
} from 'lucide-react'
import { useAuthStore, useUIStore } from '@/lib/store'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Roadmap', href: '/dashboard/roadmap', icon: Lightbulb },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Public Portal', href: '/portal', icon: Globe },
]

const bottomNav = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <aside className={cn(
      'sidebar flex flex-col transition-all duration-300',
      sidebarOpen ? 'w-64' : 'w-20'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-wine-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-600 flex items-center justify-center">
            <span className="font-oswald font-bold text-white text-lg">P</span>
          </div>
          {sidebarOpen && (
            <span className="font-oswald font-semibold text-white text-xl uppercase tracking-wide">
              Propel
            </span>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-1.5 text-wine-300 hover:text-white hover:bg-wine-800 rounded transition-colors"
        >
          <ChevronLeft className={cn(
            'w-5 h-5 transition-transform',
            !sidebarOpen && 'rotate-180'
          )} />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-accent-600 text-white'
                  : 'text-wine-200 hover:bg-wine-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="font-medium">{item.name}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-wine-800 space-y-1">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-wine-800 text-white'
                  : 'text-wine-200 hover:bg-wine-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="font-medium">{item.name}</span>
              )}
            </Link>
          )
        })}

        {/* User section */}
        {user && (
          <div className={cn(
            'flex items-center gap-3 px-3 py-2.5 mt-4',
            sidebarOpen ? 'justify-between' : 'justify-center'
          )}>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-wine-300 truncate">{user.role}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="p-1.5 text-wine-300 hover:text-white hover:bg-wine-800 rounded transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

