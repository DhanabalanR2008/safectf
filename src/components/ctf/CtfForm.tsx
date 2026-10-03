'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Save, ArrowLeft, ChevronDown, Check, Users } from 'lucide-react'

interface MemberOption {
  id: string
  name: string
  memberNumber: number
}

interface CtfFormProps {
  onBack?: () => void
  editId?: string
  initialData?: {
    name: string
    ctfUrl: string
    startAt: string
    endAt: string
    teamSize: string
    memberIds?: string[]
  }
}

export function CtfForm({ onBack, editId, initialData }: CtfFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialData?.name ?? '')
  const [ctfUrl, setCtfUrl] = useState(initialData?.ctfUrl ?? '')
  const [startAt, setStartAt] = useState(initialData?.startAt ?? '')
  const [endAt, setEndAt] = useState(initialData?.endAt ?? '')
  const [teamSize, setTeamSize] = useState(initialData?.teamSize ?? '')
  
  const [allMembers, setAllMembers] = useState<MemberOption[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(initialData?.memberIds ?? [])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')

  // Load team members to allow selecting who attends
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch('/api/members')
        if (res.ok) {
          const data: MemberOption[] = await res.json()
          setAllMembers(data)
        }
      } catch (err) {
        console.error('Failed to load team members:', err)
      }
    }
    fetchMembers()
  }, [])

  function toggleMember(memberId: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    )
  }

  function toISOString(localDatetime: string): string {
    if (!localDatetime) return ''
    return new Date(localDatetime).toISOString()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setGlobalError('')
    setLoading(true)

    const body = {
      name: name.trim(),
      source: 'MANUAL',
      ctfUrl: ctfUrl.trim() || undefined,
      startAt: toISOString(startAt),
      endAt: toISOString(endAt),
      teamSize: teamSize ? parseInt(teamSize, 10) : undefined,
      memberIds: selectedMemberIds,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-5">
        {/* CTF Name */}
        <Input
          label="CTF Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. CyberWarfare CTF 2026"
          required
          maxLength={200}
          error={errors.name}
        />

        {/* Start Date & End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Start Date & Time *</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            {errors.startAt && <p className="text-xs text-rose-600 font-medium">{errors.startAt}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">End Date & Time *</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            {errors.endAt && <p className="text-xs text-rose-600 font-medium">{errors.endAt}</p>}
          </div>
        </div>

        {/* CTF URL & Team Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="CTF Website / Event URL"
            type="url"
            value={ctfUrl}
            onChange={(e) => setCtfUrl(e.target.value)}
            placeholder="https://ctf.example.com"
            error={errors.ctfUrl}
          />

          <Input
            label="Team Members Count (Max Size)"
            type="number"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            placeholder="e.g. 4"
            min="1"
            max="100"
            error={errors.teamSize}
          />
        </div>

        {/* Members Name Selection (Down Arrow Dropdown) */}
        <div className="flex flex-col gap-1.5 relative">
          <label className="text-sm font-medium text-slate-700">Select Team Members</label>
          
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              {selectedMemberIds.length > 0 ? (
                <span className="text-slate-800 font-medium truncate">
                  {selectedMemberIds
                    .map((id) => allMembers.find((m) => m.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')}
                </span>
              ) : (
                <span className="text-slate-400">Click to choose team members...</span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 space-y-1 max-h-56 overflow-y-auto">
              {allMembers.length > 0 ? (
                allMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id)
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">#{member.memberNumber}</span>
                        <span>{member.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  )
                })
              ) : (
                <p className="text-xs text-slate-400 p-2 text-center">Loading team members...</p>
              )}
            </div>
          )}

          {selectedMemberIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {selectedMemberIds.map((id) => {
                const member = allMembers.find((m) => m.id === id)
                if (!member) return null
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-medium"
                  >
                    #{member.memberNumber} {member.name}
                    <button
                      type="button"
                      onClick={() => toggleMember(id)}
                      className="hover:text-indigo-900 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {globalError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          {globalError}
        </div>
      )}

      <div className="flex items-center gap-3">
        {onBack && (
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" /> Cancel
          </Button>
        )}
        <Button type="submit" isLoading={loading} size="lg">
          <Save className="w-4 h-4" />
          {editId ? 'Save Changes' : 'Create CTF'}
        </Button>
      </div>
    </form>
  )
}
