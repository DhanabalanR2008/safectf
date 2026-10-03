'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

type Status = 'ATTENDING' | 'MAYBE' | 'NOT_ATTENDING' | 'NO_RESPONSE'

interface AttendanceButtonsProps {
  ctfId: string
  currentStatus: Status
}

export function AttendanceButtons({ ctfId, currentStatus }: AttendanceButtonsProps) {
  const [status, setStatus] = useState<Status>(currentStatus)
  const [loading, setLoading] = useState<Status | null>(null)
  const router = useRouter()

  async function updateStatus(newStatus: Status) {
    if (newStatus === status) return
    setLoading(newStatus)

    try {
      const res = await fetch(`/api/ctfs/${ctfId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setStatus(newStatus)
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update attendance')
      }
    } catch {
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={status === 'ATTENDING' ? 'primary' : 'ghost'}
        isLoading={loading === 'ATTENDING'}
        onClick={() => updateStatus('ATTENDING')}
        className={status === 'ATTENDING' ? '' : 'text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10'}
      >
        Attending
      </Button>
      <Button
        size="sm"
        variant={status === 'MAYBE' ? 'secondary' : 'ghost'}
        isLoading={loading === 'MAYBE'}
        onClick={() => updateStatus('MAYBE')}
        className={status === 'MAYBE' ? 'bg-yellow-500/20 text-yellow-400' : 'text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/10'}
      >
        Maybe
      </Button>
      <Button
        size="sm"
        variant="ghost"
        isLoading={loading === 'NOT_ATTENDING'}
        onClick={() => updateStatus('NOT_ATTENDING')}
        className={status === 'NOT_ATTENDING' ? 'bg-red-500/20 text-red-400' : 'text-red-400 border border-red-500/30 hover:bg-red-500/10'}
      >
        Not Attending
      </Button>
    </div>
  )
}
