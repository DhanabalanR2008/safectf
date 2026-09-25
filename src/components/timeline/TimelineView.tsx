'use client'

import Link from 'next/link'
import { format, isPast } from 'date-fns'
import { Users, Clock, ChevronRight } from 'lucide-react'

type AttendanceStatus = 'ATTENDING' | 'MAYBE' | 'NOT_ATTENDING' | 'NO_RESPONSE'

export interface TimelineCtf {
  id: string
  name: string
  source: 'UNSTOP' | 'CTFTIME' | 'MANUAL'
  sourceUrl?: string | null
  ctfUrl?: string | null
  startAt: Date | string
  endAt: Date | string
  teamSize?: number | null
  description?: string | null
  attendance: Array<{ status: AttendanceStatus }>
}

export function TimelineView({ ctfs }: { ctfs: TimelineCtf[] }) {
  if (ctfs.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl">
        <p className="text-slate-400 text-sm mb-4">No CTFs scheduled yet.</p>
        <Link
          href="/ctfs/add"
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-semibold text-sm rounded-lg transition-colors"
        >
          Add First CTF
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-5xl">
      {/* Left Column Heading */}
      <div className="lg:col-span-4 lg:sticky lg:top-8 self-start space-y-2">
        <span className="text-xs font-bold tracking-widest text-rose-500 uppercase">
          Our Schedule
        </span>
        <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight uppercase leading-tight font-sans">
          OVER THE <br className="hidden lg:inline" />
          YEARS
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed pt-1">
          Cybersecurity competitions and team schedules in chronological order.
        </p>
      </div>

      {/* Right Column: Clean Vertical Timeline */}
      <div className="lg:col-span-8 relative pl-6 sm:pl-8 border-l-2 border-rose-500/70 space-y-8 my-1">
        {ctfs.map((ctf) => {
          const startDate = new Date(ctf.startAt)
          const endDate = new Date(ctf.endAt)
          const attendingCount = ctf.attendance.filter((a) => a.status === 'ATTENDING').length
          const isOngoing = isPast(startDate) && !isPast(endDate)
          const isFinished = isPast(endDate)
          const year = format(startDate, 'yyyy')

          return (
            <div key={ctf.id} className="relative group">
              {/* Timeline Node Marker */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-xs transition-transform group-hover:scale-125 ${
                  isOngoing
                    ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                    : isFinished
                    ? 'bg-slate-600'
                    : 'bg-rose-500 ring-4 ring-rose-500/20'
                }`}
              />

              {/* Year & Date on Top in Rose Color */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold tracking-wider text-rose-500 uppercase">
                  {year} • {format(startDate, 'MMM d')}
                </span>
                {isOngoing && (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    (Live Now)
                  </span>
                )}
              </div>

              {/* CTF Name */}
              <Link href={`/ctfs/${ctf.id}`} className="block group">
                <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-rose-300 transition-colors leading-snug">
                  {ctf.name}
                </h3>
              </Link>

              {/* Clean Details: Time & Members */}
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {format(startDate, 'h:mm a')} – {format(endDate, 'h:mm a')}
                </span>

                <span className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-4 h-4 text-slate-400" />
                  {attendingCount} / 6 Attending
                </span>

                <Link
                  href={`/ctfs/${ctf.id}`}
                  className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-400 hover:text-rose-300 ml-auto transition-colors"
                >
                  Details <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
