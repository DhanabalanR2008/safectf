'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function DeleteCtfButton({ ctfId }: { ctfId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this CTF? This action cannot be undone.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/ctfs/${ctfId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete CTF')
        setLoading(false)
      }
    } catch {
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50"
      title="Delete CTF"
    >
      <Trash2 className="w-4 h-4" />
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  )
}
