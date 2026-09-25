'use client'

import { useRouter } from 'next/navigation'
import { format, differenceInDays, startOfDay, addDays, min, max } from 'date-fns'

type AttendanceStatus = 'ATTENDING' | 'MAYBE' | 'NOT_ATTENDING' | 'NO_RESPONSE'

interface CtfWithAttendance {
  id: string
  name: string
  startAt: Date | string
  endAt: Date | string
  attendance: Array<{ status: AttendanceStatus }>
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  ATTENDING: 'bg-emerald-400',
  MAYBE: 'bg-yellow-400',
  NOT_ATTENDING: 'bg-red-400',
  NO_RESPONSE: 'bg-slate-500',
}

export function TimelineView({ ctfs }: { ctfs: CtfWithAttendance[] }) {
  const router = useRouter()

  if (ctfs.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <p className="text-slate-400">No CTFs scheduled yet.</p>
      </div>
    )
  }

  const dates = ctfs.flatMap((c) => [new Date(c.startAt), new Date(c.endAt)])
  const timelineStart = startOfDay(min(dates))
  const timelineEnd = startOfDay(addDays(max(dates), 1))
  const totalDays = Math.max(differenceInDays(timelineEnd, timelineStart), 1)

  // Generate date labels (every ~7 days)
  const labelInterval = Math.max(Math.floor(totalDays / 6), 1)
  const dateLabels: Date[] = []
  for (let i = 0; i <= totalDays; i += labelInterval) {
    dateLabels.push(addDays(timelineStart, i))
  }

  function getBarStyle(ctf: CtfWithAttendance) {
    const start = new Date(ctf.startAt)
    const end = new Date(ctf.endAt)
    const dayOffset = Math.max(differenceInDays(startOfDay(start), timelineStart), 0)
    const duration = Math.max(differenceInDays(startOfDay(addDays(end, 1)), startOfDay(start)), 1)
    const left = (dayOffset / totalDays) * 100
    const width = Math.min((duration / totalDays) * 100, 100 - left)
    return { left: `${left}%`, width: `${width}%` }
  }

  function attendingCount(ctf: CtfWithAttendance) {
    return ctf.attendance.filter((a) => a.status === 'ATTENDING').length
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      {/* Date ruler */}
      <div className="relative ml-36 mb-4 h-5">
        {dateLabels.map((date, i) => {
          const left = (differenceInDays(date, timelineStart) / totalDays) * 100
          return (
            <span
              key={i}
              className="absolute text-xs text-slate-500 transform -translate-x-1/2"
              style={{ left: `${left}%` }}
            >
              {format(date, 'MMM d')}
            </span>
          )
        })}
      </div>

      {/* CTF bars */}
      <div className="space-y-3">
        {ctfs.map((ctf) => {
          const barStyle = getBarStyle(ctf)
          const attending = attendingCount(ctf)

          return (
            <div key={ctf.id} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-36 shrink-0 text-right">
                <p className="text-sm font-medium text-slate-200 truncate">{ctf.name}</p>
                <p className="text-xs text-slate-500">{attending}/6</p>
              </div>

              {/* Bar track */}
              <div className="relative flex-1 h-8 bg-slate-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => router.push(`/ctfs/${ctf.id}`)}
                  className="absolute h-full rounded-md bg-cyan-500/40 hover:bg-cyan-500/60 border border-cyan-500/50 transition-colors cursor-pointer flex items-center px-2"
                  style={barStyle}
                  title={`${ctf.name} — ${format(new Date(ctf.startAt), 'MMM d')} to ${format(new Date(ctf.endAt), 'MMM d')}`}
                >
                  <span className="text-xs text-cyan-300 font-medium truncate">
                    {format(new Date(ctf.startAt), 'MMM d')} → {format(new Date(ctf.endAt), 'MMM d')}
                  </span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
