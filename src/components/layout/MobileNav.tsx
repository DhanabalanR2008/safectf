'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, Calendar, Users, PlusCircle, History, Settings, LogOut, Shield, Menu, X } from 'lucide-react'

interface MobileNavProps {
  role: string
  memberName: string | null
}

export function MobileNav({ role, memberName }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/timeline', label: 'Timeline', icon: Calendar },
    { href: '/members', label: 'Members', icon: Users },
    { href: '/ctfs/add', label: 'Add CTF', icon: PlusCircle },
  ]

  return (
    <>
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <Link href="/dashboard" prefetch={true} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">SafeCTF</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-slate-900/40 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <div className="w-72 bg-white border-l border-slate-200 flex flex-col p-4 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
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
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  pathname.startsWith('/admin') ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Admin Panel
              </Link>
            )}
            <div className="mt-auto pt-4 border-t border-slate-100">
              <p className="text-sm font-semibold text-slate-800 mb-2">{memberName}</p>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
