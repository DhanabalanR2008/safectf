'use client'

import Link from 'next/link'
import { format, isPast, isFuture, isToday } from 'date-fns'
import { ExternalLink, Users, Calendar, Clock, ChevronRight } from 'lucide-react'

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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl">
        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-300">No CTFs Scheduled Yet</h3>
        <p className="text-slate-500 text-sm mt-1 mb-5">
          Add your upcoming Unstop or CTFtime competitions to build your team timeline.
        </p>
        <Link
          href="/ctfs/add"
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors"
        >
          Add First CTF
        </Link>
      </div>
    )
  }

  const upcomingCount = ctfs.filter((c) => !isPast(new Date(c.endAt))).length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-6xl">
      {/* Left Column Header (Inspired by 'Over The Years') */}
      <div className="lg:col-span-4 lg:sticky lg:top-8 self-start space-y-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-rose-500 uppercase">
            Team Schedule
          </span>
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight uppercase mt-1 leading-tight font-sans">
            OVER THE <br className="hidden lg:inline" />
            SEASON
          </h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Upcoming cybersecurity competitions, Unstop hackathons, and team milestones in chronological order.
          </p>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Competitions</span>
            <span className="text-sm font-bold text-white">{ctfs.length}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 pt-2">
            <span className="text-xs text-slate-400">Upcoming / Active</span>
            <span className="text-sm font-bold text-rose-400">{upcomingCount}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 pt-2">
            <span className="text-xs text-slate-400">Team Size</span>
            <span className="text-sm font-bold text-cyan-400">6 Members</span>
          </div>
        </div>

        <Link
          href="/ctfs/add"
          className="inline-flex items-center gap-2 text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors"
        >
          + Add New Competition
        </Link>
      </div>

      {/* Right Column: Vertical Timeline */}
      <div className="lg:col-span-8 relative pl-6 sm:pl-8 border-l-2 border-rose-500/70 space-y-10 my-2">
        {ctfs.map((ctf) => {
          const startDate = new Date(ctf.startAt)
          const endDate = new Date(ctf.endAt)
          const attendingCount = ctf.attendance.filter((a) => a.status === 'ATTENDING').length
          const isOngoing = isPast(startDate) && !isPast(endDate)
          const isFinished = isPast(endDate)
          const year = format(startDate, 'yyyy')
          const dateRange = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`

          return (
            <div key={ctf.id} className="relative group">
              {/* Timeline Marker Node (Square with glowing border matching the image) */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-xs transition-transform group-hover:scale-125 ${
                  isOngoing
                    ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                    : isFinished
                    ? 'bg-slate-600'
                    : 'bg-rose-500 ring-4 ring-rose-500/20'
                }`}
              />

              {/* Year / Date Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-extrabold tracking-wider text-rose-400 uppercase">
                  {year} • {format(startDate, 'MMM d')}
                </span>
                {isOngoing && (
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    Live Now
                  </span>
                )}
                {isFinished && (
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                )}
              </div>

              {/* Title & Card */}
              <Link href={`/ctfs/${ctf.id}`} className="block group">
                <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-rose-300 transition-colors leading-snug">
                  {ctf.name}
                </h3>
              </Link>

              {/* CTF Metadata Details */}
              <div className="mt-2 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  {/* Source */}
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                      ctf.source === 'UNSTOP'
                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                        : ctf.source === 'CTFTIME'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                    }`}
                  >
                    {ctf.source}
                  </span>

                  {/* Attendance */}
                  <span className="flex items-center gap-1 text-cyan-400 font-medium">
                    <Users className="w-3.5 h-3.5" />
                    {attendingCount} / 6 Attending
                  </span>

                  {/* Time Range */}
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {format(startDate, 'h:mm a')} → {format(endDate, 'h:mm a')}
                  </span>
                </div>

                {ctf.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {ctf.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-500">{dateRange}</span>
                  <Link
                    href={`/ctfs/${ctf.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    View CTF <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
