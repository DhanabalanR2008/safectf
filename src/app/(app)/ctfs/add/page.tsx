'use client'

import { CtfForm } from '@/components/ctf/CtfForm'
import { useRouter } from 'next/navigation'

export default function AddCtfPage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Add New CTF</h1>
        <p className="text-slate-400 text-sm mt-1">
          Schedule a CTF event, specify competition timeline, team limit, and select team members.
        </p>
      </div>

      <CtfForm onBack={() => router.push('/dashboard')} />
    </div>
  )
}
