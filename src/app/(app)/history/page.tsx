import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { History as HistoryIcon, Clock, Users, ExternalLink, ArrowRight } from 'lucide-react'

export default async function HistoryPage() {
  const session = await auth()
  if (!session) redirect('/imadminlogin')

  const now = new Date()

  // Completed CTFs where end date has passed
  const pastCtfs = await db.ctf.findMany({
    where: {
      endAt: { lt: now },
    },
    orderBy: { endAt: 'desc' },
    include: {
      attendance: {
        include: { member: { select: { id: true, name: true, memberNumber: true } } },
      },
      createdBy: {
        include: { member: { select: { name: true } } },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
          <HistoryIcon className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CTF History</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Archived competitions that have already concluded.
          </p>
        </div>
      </div>

      {pastCtfs.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {pastCtfs.map((ctf) => {
            const attendingMembers = ctf.attendance.filter((a) => a.status === 'ATTENDING')
            return (
              <Card key={ctf.id} className="p-5 hover:border-slate-700 transition-all">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-md text-xs font-semibold uppercase tracking-wider">
                        Ended {format(ctf.endAt, 'MMM d, yyyy')}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{ctf.name}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {format(ctf.startAt, 'MMM d, h:mm a')} – {format(ctf.endAt, 'h:mm a')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {attendingMembers.length} Participated
                      </span>
                      {ctf.createdBy.member?.name && (
                        <span>Added by {ctf.createdBy.member.name}</span>
                      )}
                    </div>

                    {/* Attending members list */}
                    {attendingMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {attendingMembers.map((att) => (
                          <span
                            key={att.id}
                            className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md text-xs"
                          >
                            #{att.member.memberNumber} {att.member.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    <Link href={`/ctfs/${ctf.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        View
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    {ctf.ctfUrl && (
                      <a href={ctf.ctfUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="p-2" title="Event URL">
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-16">
          <HistoryIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="font-semibold text-slate-300">No Past Competitions</h3>
          <p className="text-sm text-slate-500 mt-1">
            Once scheduled CTFs conclude their end time, they will appear here automatically.
          </p>
        </Card>
      )}
    </div>
  )
}
