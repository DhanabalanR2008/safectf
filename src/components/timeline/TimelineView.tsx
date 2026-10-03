'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Users, Clock } from 'lucide-react'

type AttendanceStatus = 'ATTENDING' | 'MAYBE' | 'NOT_ATTENDING' | 'NO_RESPONSE'

export interface TimelineCtf {
  id: string
  name: string
  startAt: Date | string
  endAt: Date | string
  attendance: Array<{ status: AttendanceStatus }>
}

export function TimelineView({ ctfs }: { ctfs: TimelineCtf[] }) {
  if (ctfs.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-lg">
        <p className="text-slate-400 text-sm">No CTFs scheduled yet.</p>
      </div>
    )
  }

  return (
    <div className="relative pl-6 sm:pl-8 border-l-2 border-rose-500/70 space-y-10 my-4 max-w-2xl">
      {ctfs.map((ctf) => {
        const startDate = new Date(ctf.startAt)
        const endDate = new Date(ctf.endAt)
        const attendingCount = ctf.attendance.filter((a) => a.status === 'ATTENDING').length
        const year = format(startDate, 'yyyy')

        return (
          <div key={ctf.id} className="relative group">
            {/* Timeline Square Node Marker */}
            <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 bg-rose-500 rounded-xs ring-4 ring-rose-500/20" />

            {/* 1. Year & Date */}
            <p className="text-xs font-bold tracking-wider text-rose-500 uppercase mb-1">
              {year} • {format(startDate, 'MMM d')}
            </p>

            {/* 2. CTF Name (Bold title linking to the CTF) */}
            <Link href={`/ctfs/${ctf.id}`} className="block group">
              <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-rose-300 transition-colors leading-snug">
                {ctf.name}
              </h3>
            </Link>

            {/* 3. Time & 4. Members */}
            <div className="flex flex-wrap items-center gap-5 mt-2 text-sm text-slate-400">
              {/* Time */}
              <span className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-4 h-4 text-slate-400" />
                {format(startDate, 'h:mm a')} – {format(endDate, 'h:mm a')}
              </span>

              {/* Members */}
              <span className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-4 h-4 text-slate-400" />
                {attendingCount} / 6 Attending
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
