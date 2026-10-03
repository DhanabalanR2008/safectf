import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'
import { AttendanceButtons } from '@/components/ctf/AttendanceButtons'
import { DeleteCtfButton } from '@/components/ctf/DeleteCtfButton'
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

  const addedByName = ctf.createdBy.member?.name ?? ctf.createdBy.email

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 truncate">{ctf.name}</h1>
        </div>
        {session.user.role === 'ADMIN' && (
          <DeleteCtfButton ctfId={ctf.id} />
        )}
      </div>

      {/* CTF Info */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Source</p>
              <Badge variant="default">{ctf.source}</Badge>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Start
              </p>
              <p className="text-sm font-medium text-slate-800">{format(ctf.startAt, 'PPP p')}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> End
              </p>
              <p className="text-sm font-medium text-slate-800">{format(ctf.endAt, 'PPP p')}</p>
            </div>

            {ctf.teamSize && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Team Size
                </p>
                <p className="text-sm font-medium text-slate-800">Up to {ctf.teamSize} members</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Scheduled by
              </p>
              <p className="text-sm font-medium text-slate-800">{addedByName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{format(ctf.createdAt, 'PPP')}</p>
            </div>

            {ctf.description && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Description
                </p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ctf.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Links */}
        {ctf.ctfUrl && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <a
              href={ctf.ctfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
            >
              <ExternalLink className="w-4 h-4" /> Open CTF Portal
            </a>
          </div>
        )}
      </Card>

      {/* My Attendance */}
      {session.user.memberId && (
        <Card>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">My Attendance</h2>
          <AttendanceButtons ctfId={ctf.id} currentStatus={myStatus} />
        </Card>
      )}

      {/* Team Attendance */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Team Attendance</h2>
          <span className="text-indigo-600 font-semibold text-sm">{attendingCount} / 6 Attending</span>
        </div>
        <div className="space-y-2">
          {ctf.attendance.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-400 font-mono w-4">#{att.member.memberNumber}</span>
                <span className="text-sm font-medium text-slate-800">{att.member.name}</span>
                {att.member.id === session.user.memberId && (
                  <span className="text-xs text-indigo-600 font-medium">(you)</span>
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
