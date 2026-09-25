import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { differenceInHours, differenceInDays, format } from 'date-fns'
import { Clock, Users, AlertTriangle, ChevronRight } from 'lucide-react'

function getUrgencyLabel(startAt: Date): string | null {
  const hours = differenceInHours(startAt, new Date())
  if (hours <= 1 && hours > 0) return 'Starts in less than 1 hour'
  if (hours <= 24 && hours > 0) return 'Starts tomorrow'
  if (hours <= 72 && hours > 0) return 'Starts in 3 days'
  if (hours <= 168 && hours > 0) return 'Starts in 7 days'
  return null
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const now = new Date()

  const ctfs = await db.ctf.findMany({
    where: { startAt: { gte: now } },
    orderBy: { startAt: 'asc' },
    include: {
      attendance: {
        include: { member: { select: { name: true, memberNumber: true } } },
      },
      createdBy: {
        include: { member: { select: { name: true } } },
      },
    },
  })

  const nextCtf = ctfs[0] ?? null
  const upcomingCtfs = ctfs.slice(0, 6)

  const needsAttention = ctfs.filter((ctf) => {
    const label = getUrgencyLabel(ctf.startAt)
    if (!label) return false
    const noResponseCount = ctf.attendance.filter(
      (a) => a.status === 'NO_RESPONSE'
    ).length
    return noResponseCount > 0
  })

  function attendingCount(ctf: typeof ctfs[0]) {
    return ctf.attendance.filter((a) => a.status === 'ATTENDING').length
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Welcome back,{' '}
          <span className="text-cyan-400">{session.user.memberName ?? session.user.email}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next CTF */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Next CTF</h2>
          </div>
          {nextCtf ? (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{nextCtf.name}</h3>
              <div className="text-sm text-slate-400 space-y-1 mb-4">
                <p>{format(nextCtf.startAt, 'MMM d, h:mm a')} → {format(nextCtf.endAt, 'MMM d, h:mm a')}</p>
                {nextCtf.source && (
                  <p className="text-slate-500">Source: {nextCtf.source}</p>
                )}
                <p className="text-cyan-400 font-medium">
                  {attendingCount(nextCtf)} / 6 attending
                </p>
              </div>
              <Link href={`/ctfs/${nextCtf.id}`}>
                <Button size="sm" variant="outline">
                  View CTF <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-slate-500 text-sm">
              No upcoming CTFs.{' '}
              <Link href="/ctfs/add" className="text-cyan-400 hover:underline">Add one?</Link>
            </div>
          )}
        </Card>

        {/* Needs Attention */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Needs Attention</h2>
          </div>
          {needsAttention.length > 0 ? (
            <div className="space-y-3">
              {needsAttention.map((ctf) => {
                const noResponse = ctf.attendance.filter((a) => a.status === 'NO_RESPONSE').length
                return (
                  <div key={ctf.id} className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-3">
                    <p className="text-sm font-medium text-white">{ctf.name}</p>
                    <p className="text-xs text-yellow-400 mt-0.5">{getUrgencyLabel(ctf.startAt)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{noResponse} member{noResponse !== 1 ? 's' : ''} haven't responded</p>
                    <RemindButton ctfId={ctf.id} />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No urgent items. Team is staying on top of things!</p>
          )}
        </Card>
      </div>

      {/* Upcoming CTFs */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Upcoming CTFs</h2>
        </div>
        {upcomingCtfs.length > 0 ? (
          <div className="space-y-2">
            {upcomingCtfs.map((ctf) => (
              <Link
                key={ctf.id}
                href={`/ctfs/${ctf.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                    {ctf.name}
                  </p>
                  <p className="text-xs text-slate-500">{format(ctf.startAt, 'MMM d')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-cyan-400 font-medium">
                    {attendingCount(ctf)}/6
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No upcoming CTFs scheduled.</p>
        )}
      </Card>
    </div>
  )
}

// Client component for remind button
import { RemindButtonClient } from '@/components/dashboard/RemindButton'
function RemindButton({ ctfId }: { ctfId: string }) {
  return <RemindButtonClient ctfId={ctfId} />
}
