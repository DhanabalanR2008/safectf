import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'
import { AttendanceButtons } from '@/components/ctf/AttendanceButtons'
import { ExternalLink, User, Calendar, Users, Info, ArrowLeft } from 'lucide-react'

export default async function CtfDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  const ctf = await db.ctf.findUnique({
    where: { id },
    include: {
      createdBy: {
        include: { member: { select: { name: true } } },
      },
      attendance: {
        include: {
          member: { select: { id: true, name: true, memberNumber: true } },
        },
        orderBy: { member: { memberNumber: 'asc' } },
      },
    },
  })

  if (!ctf) notFound()

  const attendingCount = ctf.attendance.filter((a) => a.status === 'ATTENDING').length
  const myAttendance = ctf.attendance.find((a) => a.member.id === session.user.memberId)
  const myStatus = (myAttendance?.status ?? 'NO_RESPONSE') as
    | 'ATTENDING'
    | 'MAYBE'
    | 'NOT_ATTENDING'
    | 'NO_RESPONSE'

  const sourceVariant = ctf.source.toLowerCase() as 'default'
  const addedByName = ctf.createdBy.member?.name ?? ctf.createdBy.email

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">{ctf.name}</h1>
      </div>

      {/* CTF Info */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Source</p>
              <Badge variant="default">{ctf.source}</Badge>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Start
              </p>
              <p className="text-sm text-slate-200">{format(ctf.startAt, 'PPP p')}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> End
              </p>
              <p className="text-sm text-slate-200">{format(ctf.endAt, 'PPP p')}</p>
            </div>

            {ctf.registrationDeadline && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Registration Deadline</p>
                <p className="text-sm text-slate-200">{format(ctf.registrationDeadline, 'PPP p')}</p>
              </div>
            )}

            {ctf.teamSize && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Team Size
                </p>
                <p className="text-sm text-slate-200">Up to {ctf.teamSize} members</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Added by
              </p>
              <p className="text-sm text-white font-medium">{addedByName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{format(ctf.createdAt, 'PPP')}</p>
            </div>

            {ctf.description && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Description
                </p>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{ctf.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-slate-800">
          {ctf.ctfUrl && (
            <a
              href={ctf.ctfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Open CTF
            </a>
          )}
          {ctf.sourceUrl && ctf.sourceUrl !== ctf.ctfUrl && (
            <a
              href={ctf.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-600 hover:border-slate-400 text-slate-300 text-sm rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> {ctf.source} Page
            </a>
          )}
        </div>
      </Card>

      {/* My Attendance */}
      {session.user.memberId && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">My Attendance</h2>
          <AttendanceButtons ctfId={ctf.id} currentStatus={myStatus} />
        </Card>
      )}

      {/* Team Attendance */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Team Attendance</h2>
          <span className="text-cyan-400 font-semibold text-sm">{attendingCount} / 6</span>
        </div>
        <div className="space-y-2">
          {ctf.attendance.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-mono w-4">#{att.member.memberNumber}</span>
                <span className="text-sm font-medium text-slate-200">{att.member.name}</span>
                {att.member.id === session.user.memberId && (
                  <span className="text-xs text-cyan-400">(you)</span>
                )}
              </div>
              <StatusDot status={att.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
