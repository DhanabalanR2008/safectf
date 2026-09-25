import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { TimelineView } from '@/components/timeline/TimelineView'

export default async function TimelinePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const ctfs = await db.ctf.findMany({
    orderBy: { startAt: 'asc' },
    include: {
      attendance: true,
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Timeline</h1>
        <p className="text-slate-400 text-sm mt-1">CTF competition schedule</p>
      </div>
      <TimelineView ctfs={ctfs} />
    </div>
  )
}
