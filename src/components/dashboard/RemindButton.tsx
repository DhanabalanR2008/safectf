'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Bell, Check } from 'lucide-react'

export function RemindButtonClient({ ctfId }: { ctfId: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRemind() {
    setLoading(true)
    try {
      const res = await fetch(`/api/ctfs/${ctfId}/remind`, { method: 'POST' })
      if (res.ok) setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 mt-2">
        <Check className="w-3 h-3" /> Reminder sent
      </span>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      isLoading={loading}
      onClick={handleRemind}
      className="mt-2 text-xs text-yellow-400 hover:text-yellow-300"
    >
      <Bell className="w-3 h-3" /> Remind Team
    </Button>
  )
}
