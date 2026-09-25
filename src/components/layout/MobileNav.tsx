'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, Calendar, Users, PlusCircle, Settings, LogOut, Shield, Menu, X } from 'lucide-react'

interface MobileNavProps {
  role: string
  memberName: string | null
}

export function MobileNav({ role, memberName }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/timeline', label: 'Timeline', icon: Calendar },
    { href: '/members', label: 'Members', icon: Users },
    { href: '/ctfs/add', label: 'Add CTF', icon: PlusCircle },
  ]

  return (
    <>
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-white">SafeCTF</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-slate-950/80" onClick={() => setOpen(false)} />
          <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col p-4 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    pathname === item.href ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
            {role === 'ADMIN' && (
              <Link href="/admin" onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  pathname.startsWith('/admin') ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400 hover:bg-slate-800'
                }`}>
                <Settings className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
            <div className="mt-auto pt-4 border-t border-slate-800">
              <p className="text-sm font-medium text-slate-300 mb-2">{memberName}</p>
              <button onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800">
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
