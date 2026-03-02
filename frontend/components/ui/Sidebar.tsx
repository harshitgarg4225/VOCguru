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
  ChevronLeft,
  BookOpen
} from 'lucide-react'
import { useAuthStore, useUIStore } from '@/lib/store'
import Tooltip from '@mui/material/Tooltip'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Roadmap', href: '/dashboard/roadmap', icon: Lightbulb },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Public Portal', href: '/portal', icon: Globe },
]

const bottomNav = [
  { name: 'Documentation', href: '/docs', icon: BookOpen },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  const NavLink = ({ item, isActive }: { item: typeof navigation[0], isActive: boolean }) => {
    const content = (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
          isActive
            ? 'bg-aqua-900 text-white shadow-sm'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        )}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {sidebarOpen && (
          <span className="font-medium text-sm">{item.name}</span>
        )}
      </Link>
    )

    if (!sidebarOpen) {
      return (
        <Tooltip title={item.name} placement="right" arrow>
          {content}
        </Tooltip>
      )
    }

    return content
  }

  return (
    <aside className={cn(
      'sidebar flex flex-col transition-all duration-300 dark-scrollbar',
      sidebarOpen ? 'w-64' : 'w-20'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="logo-mark-glow flex-shrink-0">
            <span className="font-display font-bold text-white text-lg">P</span>
          </div>
          {sidebarOpen && (
            <span className="font-display font-semibold text-white text-xl tracking-tight">
              PainSolver
            </span>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors',
            !sidebarOpen && 'absolute left-1/2 -translate-x-1/2 bottom-4'
          )}
        >
          <ChevronLeft className={cn(
            'w-5 h-5 transition-transform duration-300',
            !sidebarOpen && 'rotate-180'
          )} />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')) ||
            (item.href === '/dashboard' && pathname === '/dashboard')
          return (
            <NavLink key={item.name} item={item} isActive={isActive} />
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1.5">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <NavLink key={item.name} item={item} isActive={isActive} />
          )
        })}

        {/* User section */}
        {user && (
          <div className={cn(
            'flex items-center gap-3 mt-4 pt-4 border-t border-slate-800',
            !sidebarOpen && 'justify-center'
          )}>
            <div className="w-9 h-9 rounded-full bg-aqua-900 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
              </div>
            )}
            <Tooltip title="Sign out" placement="top" arrow>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </aside>
  )
}
