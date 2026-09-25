'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Save, ArrowLeft } from 'lucide-react'

interface CtfFormProps {
  source: 'UNSTOP' | 'CTFTIME' | 'MANUAL'
  prefill?: Record<string, unknown> | null
  onBack?: () => void
  editId?: string
  initialData?: {
    name: string
    sourceUrl: string
    ctfUrl: string
    startAt: string
    endAt: string
    registrationDeadline: string
    teamSize: string
    description: string
  }
}

function toLocalDatetime(isoString?: string | null): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toISOString(localDatetime: string): string {
  if (!localDatetime) return ''
  return new Date(localDatetime).toISOString()
}

export function CtfForm({ source, prefill, onBack, editId, initialData }: CtfFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialData?.name ?? '')
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl ?? '')
  const [ctfUrl, setCtfUrl] = useState(initialData?.ctfUrl ?? '')
  const [startAt, setStartAt] = useState(initialData?.startAt ?? '')
  const [endAt, setEndAt] = useState(initialData?.endAt ?? '')
  const [regDeadline, setRegDeadline] = useState(initialData?.registrationDeadline ?? '')
  const [teamSize, setTeamSize] = useState(initialData?.teamSize ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')

  // Apply AI prefill
  useEffect(() => {
    if (!prefill) return
    if (prefill.name) setName(prefill.name as string)
    if (prefill.ctfUrl) setCtfUrl(prefill.ctfUrl as string)
    if (prefill.description) setDescription(prefill.description as string)
    if (prefill.teamSize) setTeamSize(String(prefill.teamSize))
    // Combine date + time
    if (prefill.startDate && prefill.startTime) {
      setStartAt(`${prefill.startDate}T${prefill.startTime}`)
    }
    if (prefill.endDate && prefill.endTime) {
      setEndAt(`${prefill.endDate}T${prefill.endTime}`)
    }
    if (prefill.registrationDeadline) {
      const d = new Date(prefill.registrationDeadline as string)
      if (!isNaN(d.getTime())) setRegDeadline(toLocalDatetime(prefill.registrationDeadline as string))
    }
  }, [prefill])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setGlobalError('')
    setLoading(true)

    const body = {
      name,
      source,
      sourceUrl: sourceUrl || undefined,
      ctfUrl: ctfUrl || undefined,
      startAt: toISOString(startAt),
      endAt: toISOString(endAt),
      registrationDeadline: regDeadline ? toISOString(regDeadline) : undefined,
      teamSize: teamSize ? parseInt(teamSize) : undefined,
      description: description || undefined,
    }

    try {
      const url = editId ? `/api/ctfs/${editId}` : '/api/ctfs'
      const method = editId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.details?.fieldErrors) {
          const fieldErrors: Record<string, string> = {}
          Object.entries(data.details.fieldErrors).forEach(([k, v]) => {
            fieldErrors[k] = Array.isArray(v) ? v[0] : String(v)
          })
          setErrors(fieldErrors)
        } else {
          setGlobalError(data.error || 'Failed to save CTF')
        }
        return
      }

      router.push(`/ctfs/${data.id}`)
      router.refresh()
    } catch {
      setGlobalError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <Input
          label="CTF Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. CyberWar 2026"
          required
          maxLength={200}
          error={errors.name}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Website / CTF URL"
            type="url"
            value={ctfUrl}
            onChange={(e) => setCtfUrl(e.target.value)}
            placeholder="https://ctf.example.com"
            error={errors.ctfUrl}
          />
          <Input
            label={`${source} Source URL`}
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://unstop.com/..."
            error={errors.sourceUrl}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Start Date & Time *</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.startAt && <p className="text-xs text-red-400">{errors.startAt}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">End Date & Time *</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.endAt && <p className="text-xs text-red-400">{errors.endAt}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Registration Deadline</label>
            <input
              type="datetime-local"
              value={regDeadline}
              onChange={(e) => setRegDeadline(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.registrationDeadline && <p className="text-xs text-red-400">{errors.registrationDeadline}</p>}
          </div>

          <Input
            label="Team Size (max members)"
            type="number"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            placeholder="e.g. 6"
            min="1"
            max="100"
            error={errors.teamSize}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-300">Description / Notes</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional information about this CTF..."
            rows={4}
            maxLength={5000}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y"
          />
          {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
        </div>
      </div>

      {globalError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
          {globalError}
        </div>
      )}

      <div className="flex items-center gap-3">
        {onBack && (
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}
        <Button type="submit" isLoading={loading} size="lg">
          <Save className="w-4 h-4" />
          {editId ? 'Save Changes' : 'Save CTF'}
        </Button>
      </div>
    </form>
  )
}
