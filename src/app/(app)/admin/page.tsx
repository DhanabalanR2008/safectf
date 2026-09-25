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

  const members = await db.member.findMany({
    orderBy: { memberNumber: 'asc' },
    include: {
      user: { select: { email: true, role: true, status: true, createdAt: true } },
    },
  })

  const ctfs = await db.ctf.findMany({
    orderBy: { startAt: 'desc' },
    include: {
      createdBy: { include: { member: { select: { name: true } } } },
      attendance: true,
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage team members and CTF competitions</p>
        </div>
      </div>

      {/* Team Members Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Team Members</h2>
          </div>
          <Link
            href="/admin/members/new"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-lg text-sm hover:bg-purple-500/25 transition-colors"
          >
            + Add Member
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {members.map((member) => (
            <Card key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-mono text-slate-400">#{member.memberNumber}</span>
                </div>
                <div>
                  <p className="font-medium text-white">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.user?.email ?? 'No account linked'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={member.user?.role === 'ADMIN' ? 'admin' : 'member'}>
                  {member.user?.role ?? 'No role'}
                </Badge>
                <Badge variant={member.user?.status === 'ACTIVE' ? 'active' : 'disabled'}>
                  {member.user?.status ?? 'No account'}
                </Badge>
                <Link
                  href={`/admin/members/${member.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Edit <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          ))}

          {members.length === 0 && (
            <Card>
              <p className="text-slate-400 text-sm text-center py-4">
                No members yet.{' '}
                <Link href="/admin/members/new" className="text-purple-400 hover:underline">Add the first member.</Link>
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* CTFs Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Flag className="w-4 h-4 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">All CTFs</h2>
          <span className="text-xs text-slate-500">({ctfs.length})</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {ctfs.map((ctf) => {
            const attending = ctf.attendance.filter((a) => a.status === 'ATTENDING').length
            return (
              <Card key={ctf.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{ctf.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {format(ctf.startAt, 'MMM d, yyyy')} &middot; {attending}/6 attending &middot; Added by {ctf.createdBy.member?.name ?? ctf.createdBy.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{ctf.source}</Badge>
                  <AdminCtfActions ctfId={ctf.id} />
                </div>
              </Card>
            )
          })}

          {ctfs.length === 0 && (
            <Card>
              <p className="text-slate-400 text-sm text-center py-4">No CTFs added yet.</p>
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
