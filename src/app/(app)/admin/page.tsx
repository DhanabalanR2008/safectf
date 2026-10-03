import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { format } from 'date-fns'
import { Users, Flag, ChevronRight, Settings } from 'lucide-react'

export default async function AdminPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Run queries in parallel for instant response time
  const [members, ctfs] = await Promise.all([
    db.member.findMany({
      orderBy: { memberNumber: 'asc' },
      include: {
        user: { select: { email: true, role: true, status: true, createdAt: true } },
      },
    }),
    db.ctf.findMany({
      orderBy: { startAt: 'desc' },
      include: {
        createdBy: { include: { member: { select: { name: true } } } },
        attendance: true,
      },
    }),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Panel</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage team accounts and CTF competitions</p>
        </div>
      </div>

      {/* Team Members Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">Team Members</h2>
          </div>
          <Link
            href="/admin/members/new"
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            + Add Member
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {members.map((member) => (
            <Card key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-mono font-medium text-slate-500">#{member.memberNumber}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{member.name}</p>
                  <p className="text-xs text-slate-400">{member.user?.email ?? 'No account linked'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Badge variant={member.user?.role === 'ADMIN' ? 'admin' : 'member'}>
                  {member.user?.role ?? 'No role'}
                </Badge>
                <Badge variant={member.user?.status === 'ACTIVE' ? 'active' : 'disabled'}>
                  {member.user?.status ?? 'No account'}
                </Badge>
                <Link
                  href={`/admin/members/${member.id}`}
                  prefetch={true}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Edit <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          ))}

          {members.length === 0 && (
            <Card>
              <p className="text-slate-500 text-sm text-center py-4">
                No members yet.{' '}
                <Link href="/admin/members/new" prefetch={true} className="text-indigo-600 hover:underline">Add the first member.</Link>
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* CTFs Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-slate-500" />
          <h2 className="text-base font-bold text-slate-900">All CTFs</h2>
          <span className="text-xs text-slate-400">({ctfs.length})</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {ctfs.map((ctf) => {
            const attending = ctf.attendance.filter((a) => a.status === 'ATTENDING').length
            return (
              <Card key={ctf.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{ctf.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {format(ctf.startAt, 'MMM d, yyyy')} &middot; {attending}/6 attending &middot; Added by {ctf.createdBy.member?.name ?? ctf.createdBy.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AdminCtfActions ctfId={ctf.id} />
                </div>
              </Card>
            )
          })}

          {ctfs.length === 0 && (
            <Card>
              <p className="text-slate-500 text-sm text-center py-4">No CTFs added yet.</p>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}

import { AdminCtfActionsClient } from '@/components/admin/AdminCtfActions'
function AdminCtfActions({ ctfId }: { ctfId: string }) {
  return <AdminCtfActionsClient ctfId={ctfId} />
}
