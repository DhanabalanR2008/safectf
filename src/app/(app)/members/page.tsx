import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { StatusDot } from '@/components/ui/StatusDot'
import { AttendanceButtons } from '@/components/ctf/AttendanceButtons'

export default async function MembersPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const now = new Date()

  // Parallel database execution
  const [members, nextCtf] = await Promise.all([
    db.member.findMany({
      orderBy: { memberNumber: 'asc' },
      include: {
        user: { select: { status: true } },
      },
    }),
    db.ctf.findFirst({
      where: { startAt: { gte: now } },
      orderBy: { startAt: 'asc' },
      include: {
        attendance: {
          include: { member: { select: { name: true, memberNumber: true } } },
        },
      },
    }),
  ])

  const attendingCount = nextCtf
    ? nextCtf.attendance.filter((a) => a.status === 'ATTENDING').length
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Team Members</h1>
        {nextCtf && (
          <p className="text-slate-400 text-sm mt-1">
            Attendance for <span className="text-cyan-400">{nextCtf.name}</span>:{' '}
            <span className="text-white font-medium">{attendingCount} / 6</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
          const memberAttendance = nextCtf?.attendance.find(
            (a) => a.memberId === member.id
          )
          const status = (memberAttendance?.status ?? 'NO_RESPONSE') as
            | 'ATTENDING'
            | 'MAYBE'
            | 'NOT_ATTENDING'
            | 'NO_RESPONSE'
          const isMe = session.user.memberId === member.id

          return (
            <Card key={member.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">#{member.memberNumber}</span>
                    {isMe && (
                      <span className="text-xs bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-md">You</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mt-1">{member.name}</h3>
                </div>
                {member.user?.status === 'DISABLED' && (
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">Inactive</span>
                )}
              </div>

              <div className="mb-4">
                <StatusDot status={status} />
              </div>

              {nextCtf && isMe && (
                <AttendanceButtons ctfId={nextCtf.id} currentStatus={status} />
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
