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
        variant={status === 'ATTENDING' ? 'primary' : 'outline'}
        isLoading={loading === 'ATTENDING'}
        onClick={() => updateStatus('ATTENDING')}
        className={status === 'ATTENDING' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'}
      >
        Attending
      </Button>
      <Button
        size="sm"
        variant={status === 'MAYBE' ? 'secondary' : 'outline'}
        isLoading={loading === 'MAYBE'}
        onClick={() => updateStatus('MAYBE')}
        className={status === 'MAYBE' ? 'bg-amber-100 text-amber-800' : 'text-amber-700 hover:bg-amber-50 border-amber-200'}
      >
        Maybe
      </Button>
      <Button
        size="sm"
        variant={status === 'NOT_ATTENDING' ? 'danger' : 'outline'}
        isLoading={loading === 'NOT_ATTENDING'}
        onClick={() => updateStatus('NOT_ATTENDING')}
        className={status === 'NOT_ATTENDING' ? '' : 'text-rose-700 hover:bg-rose-50 border-rose-200'}
      >
        Not Attending
      </Button>
    </div>
  )
}
