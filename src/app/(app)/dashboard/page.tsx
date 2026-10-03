import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format, differenceInMinutes, differenceInHours } from 'date-fns'
import { Clock, Users, ExternalLink, ChevronRight, ArrowRight, PlusCircle } from 'lucide-react'

function getUrgencyText(startAt: Date, endAt: Date, now: Date) {
  if (now >= startAt && now <= endAt) {
    return 'Live Now'
  }
  const mins = differenceInMinutes(startAt, now)
  if (mins <= 60) return `Starts in ${mins}m`
  const hours = differenceInHours(startAt, now)
  if (hours <= 24) return `Starts in ${hours}h`
  return `Starts ${format(startAt, 'MMM d, h:mm a')}`
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const now = new Date()

  // Only upcoming or currently live CTFs (endAt >= now)
  // Closed / finished CTFs will appear in the History panel
  const activeCtfs = await db.ctf.findMany({
    where: {
      endAt: { gte: now },
    },
    orderBy: { startAt: 'asc' },
    include: {
      attendance: {
        include: { member: { select: { id: true, name: true, memberNumber: true } } },
      },
      createdBy: {
        include: { member: { select: { name: true } } },
      },
    },
  })

  // The closest CTF
  const nextCtf = activeCtfs[0] ?? null
  const otherActiveCtfs = activeCtfs.slice(1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Competitions</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Upcoming and live CTF challenges. Finished competitions are archived in History.
          </p>
        </div>
        <Link href="/ctfs/add">
          <Button size="md" className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Add CTF
          </Button>
        </Link>
      </div>

      {nextCtf ? (
        <div className="space-y-6">
          {/* Main Hero Card for Closest CTF */}
          <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  {getUrgencyText(nextCtf.startAt, nextCtf.endAt, now)}
                </div>

                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {nextCtf.name}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {format(nextCtf.startAt, 'MMM d, h:mm a')} – {format(nextCtf.endAt, 'MMM d, h:mm a')}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-4 h-4 text-slate-400" />
                    {nextCtf.attendance.filter((a) => a.status === 'ATTENDING').length} Attending
                    {nextCtf.teamSize ? ` (Max ${nextCtf.teamSize})` : ''}
                  </span>
                </div>

                {/* Attending Member Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {nextCtf.attendance
                    .filter((a) => a.status === 'ATTENDING')
                    .map((att) => (
                      <span
                        key={att.id}
                        className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-medium shadow-2xs"
                      >
                        #{att.member.memberNumber} {att.member.name}
                      </span>
                    ))}
                  {nextCtf.attendance.filter((a) => a.status === 'ATTENDING').length === 0 && (
                    <span className="text-xs text-slate-400 italic">No members confirmed yet</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                <Link href={`/ctfs/${nextCtf.id}`}>
                  <Button variant="primary" size="md" className="w-full justify-between gap-3">
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                {nextCtf.ctfUrl && (
                  <a href={nextCtf.ctfUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="md" className="w-full justify-between gap-3">
                      Event Portal
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </Card>

          {/* Other upcoming CTFs if any */}
          {otherActiveCtfs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Other Upcoming Competitions ({otherActiveCtfs.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherActiveCtfs.map((ctf) => {
                  const attending = ctf.attendance.filter((a) => a.status === 'ATTENDING').length
                  return (
                    <Card key={ctf.id} className="hover:border-slate-300 transition-all p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <h4 className="font-semibold text-slate-900 truncate">{ctf.name}</h4>
                          <p className="text-xs text-slate-500">
                            {format(ctf.startAt, 'MMM d, h:mm a')}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                            <span className="font-medium text-slate-700">{attending} attending</span>
                            {ctf.teamSize && <span>&middot; Max {ctf.teamSize}</span>}
                          </div>
                        </div>
                        <Link href={`/ctfs/${ctf.id}`}>
                          <Button variant="ghost" size="sm" className="p-2">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="text-center py-16 px-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Active CTFs</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            There are no ongoing or scheduled competitions right now. Completed events are stored in History.
          </p>
          <Link href="/ctfs/add">
            <Button size="md" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Schedule a CTF
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
