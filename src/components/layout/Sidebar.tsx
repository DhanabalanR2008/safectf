'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Calendar,
  Users,
  PlusCircle,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'

interface SidebarProps {
  role: string
  memberName: string | null
  memberNumber: number | null
  email: string
}

export function Sidebar({ role, memberName, memberNumber, email }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/timeline', label: 'Timeline', icon: Calendar },
    { href: '/members', label: 'Members', icon: Users },
    { href: '/ctfs/add', label: 'Add CTF', icon: PlusCircle },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 min-h-screen sticky top-0">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-cyan-400" />
          <span className="text-lg font-bold text-white">SafeCTF</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/ctfs/add' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}

        {role === 'ADMIN' && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith('/admin')
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            Admin Panel
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-200">{memberName ?? email}</p>
          {memberNumber && (
            <p className="text-xs text-slate-500">Member #{memberNumber}</p>
          )}
          {role === 'ADMIN' && (
            <span className="text-xs text-purple-400 font-medium">Administrator</span>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
