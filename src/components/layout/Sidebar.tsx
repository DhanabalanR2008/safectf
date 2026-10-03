'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Calendar,
  Users,
  PlusCircle,
  History,
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
    { href: '/history', label: 'History', icon: History },
    { href: '/timeline', label: 'Timeline', icon: Calendar },
    { href: '/members', label: 'Members', icon: Users },
    { href: '/ctfs/add', label: 'Add CTF', icon: PlusCircle },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen sticky top-0 shrink-0">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/dashboard" prefetch={true} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">SafeCTF</span>
        </Link>
      </div>

      <nav className="flex-1 p-3.5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/ctfs/add' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          )
        })}

        {role === 'ADMIN' && (
          <Link
            href="/admin"
            prefetch={true}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              pathname.startsWith('/admin')
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className={`w-4 h-4 ${pathname.startsWith('/admin') ? 'text-indigo-600' : 'text-slate-400'}`} />
            Admin Panel
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="mb-3 px-1">
          <p className="text-sm font-semibold text-slate-800 truncate">{memberName ?? email}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {memberNumber !== null && memberNumber !== undefined && (
              <span className="text-xs text-slate-400 font-medium">Member #{memberNumber}</span>
            )}
            {role === 'ADMIN' && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm font-semibold">Admin</span>
            )}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
