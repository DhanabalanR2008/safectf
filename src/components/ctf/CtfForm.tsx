'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Save, ArrowLeft, ChevronDown, Check, Users, Mic, MicOff, Loader2 } from 'lucide-react'

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

  // Voice control state
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'done' | 'error'>('idle')
  const [voiceError, setVoiceError] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

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

  // ------ Voice Control ------
  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setVoiceError('Voice recognition not supported in this browser. Try Chrome.')
      setVoiceStatus('error')
      return
    }

    setVoiceTranscript('')
    setVoiceError('')
    setVoiceStatus('listening')
    setIsListening(true)

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'en-IN'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) final += t
        else interim += t
      }
      setVoiceTranscript((prev) => prev + final + interim)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (voiceTranscript.trim().length > 2 || recognitionRef.current !== null) {
        // onend fires before last state update; grab from DOM via ref
        processTranscript()
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setIsListening(false)
      setVoiceStatus('error')
      if (event.error === 'not-allowed') {
        setVoiceError('Microphone permission blocked. Click the lock/settings icon in your browser address bar and enable Microphone.')
      } else if (event.error === 'no-speech') {
        setVoiceError('No speech detected. Please try speaking closer to the mic.')
      } else {
        setVoiceError(`Microphone error: ${event.error}`)
      }
      recognitionRef.current = null
    }

    recognition.start()
  }

  function stopListening() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
  }

  async function processTranscript() {
    const text = voiceTranscript.trim()
    if (!text) {
      setVoiceStatus('error')
      setVoiceError('No speech detected. Please try again.')
      return
    }

    setVoiceStatus('processing')
    setIsProcessing(true)

    try {
      const res = await fetch('/api/ai/voice-ctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })
      const data = await res.json()

      if (!res.ok) {
        setVoiceStatus('error')
        setVoiceError(data.error || 'Failed to process voice input')
        return
      }

      const ex = data.extracted as {
        name?: string
        ctfUrl?: string
        startDate?: string
        startTime?: string
        endDate?: string
        endTime?: string
        teamSize?: number
        memberNames?: string[]
      }

      // Fill form fields
      if (ex.name) setName(ex.name)
      if (ex.ctfUrl) setCtfUrl(ex.ctfUrl)

      if (ex.startDate) {
        const time = ex.startTime || '09:00'
        // datetime-local format: YYYY-MM-DDTHH:MM
        setStartAt(`${ex.startDate}T${time}`)
      }
      if (ex.endDate) {
        const time = ex.endTime || '18:00'
        setEndAt(`${ex.endDate}T${time}`)
      }
      if (ex.teamSize) setTeamSize(String(ex.teamSize))

      // Match spoken names to actual member list (case-insensitive fuzzy)
      if (ex.memberNames && ex.memberNames.length > 0) {
        const matchedIds: string[] = []
        for (const spokenName of ex.memberNames) {
          const lower = spokenName.toLowerCase().trim()
          const match = allMembers.find(
            (m) =>
              m.name.toLowerCase().includes(lower) ||
              lower.includes(m.name.toLowerCase().split(' ')[0])
          )
          if (match && !matchedIds.includes(match.id)) {
            matchedIds.push(match.id)
          }
        }
        if (matchedIds.length > 0) {
          setSelectedMemberIds((prev) => [...new Set([...prev, ...matchedIds])])
        }
      }

      setVoiceStatus('done')
    } catch {
      setVoiceStatus('error')
      setVoiceError('Failed to connect to AI. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  function handleMicClick() {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // After stopListening triggers onend, processTranscript is called — but we need
  // the latest transcript. Use an effect to handle the stop→process flow:
  const prevListening = useRef(false)
  useEffect(() => {
    if (prevListening.current && !isListening && voiceStatus === 'listening') {
      processTranscript()
    }
    prevListening.current = isListening
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening])

  // ------ Submit ------
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

  const micStatusColor =
    voiceStatus === 'listening'
      ? 'bg-red-500/20 border-red-500/50 text-red-400'
      : voiceStatus === 'processing'
      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      : voiceStatus === 'done'
      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
      : voiceStatus === 'error'
      ? 'bg-red-500/10 border-red-500/30 text-red-400'
      : 'bg-slate-700/50 border-slate-600 text-slate-400'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">

        {/* Voice Control Banner */}
        <div className="flex items-start gap-3 p-3 bg-slate-800/60 border border-slate-700 rounded-lg">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isProcessing}
            title={isListening ? 'Stop listening' : 'Start voice input'}
            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 disabled:opacity-50 ${
              isListening
                ? 'bg-red-500 border-red-400 text-white animate-pulse shadow-lg shadow-red-500/40'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-300 mb-0.5">
              {isListening
                ? '🔴 Listening… Speak now — say the CTF name, dates, team size and member names'
                : isProcessing
                ? '⏳ Processing with Gemini AI…'
                : voiceStatus === 'done'
                ? '✅ Form filled from voice! Review the fields below.'
                : voiceStatus === 'error'
                ? '❌ ' + voiceError
                : '🎤 Click the mic to fill this form by voice'}
            </p>

            {voiceTranscript && (
              <p className="text-xs text-slate-500 truncate">
                Heard: &ldquo;{voiceTranscript}&rdquo;
              </p>
            )}

            {isProcessing && (
              <div className="flex items-center gap-1.5 mt-1">
                <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                <span className="text-xs text-cyan-400">Gemini is parsing your voice…</span>
              </div>
            )}
          </div>

          {voiceStatus !== 'idle' && !isListening && !isProcessing && (
            <button
              type="button"
              onClick={() => {
                setVoiceStatus('idle')
                setVoiceTranscript('')
                setVoiceError('')
              }}
              className="text-xs text-slate-500 hover:text-slate-300 flex-shrink-0"
            >
              Clear
            </button>
          )}
        </div>

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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Start Date &amp; Time *</label>
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
            <label className="text-sm font-medium text-slate-300">End Date &amp; Time *</label>
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
        <div className="flex flex-col gap-1 relative">
          <label className="text-sm font-medium text-slate-300">Select Team Members</label>

          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Users className="w-4 h-4 text-cyan-400 shrink-0" />
              {selectedMemberIds.length > 0 ? (
                <span className="text-white font-medium truncate">
                  {selectedMemberIds
                    .map((id) => allMembers.find((m) => m.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')}
                </span>
              ) : (
                <span className="text-slate-500">Click to choose team members...</span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-2 space-y-1 max-h-56 overflow-y-auto">
              {allMembers.length > 0 ? (
                allMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id)
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">#{member.memberNumber}</span>
                        <span>{member.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </button>
                  )
                })
              ) : (
                <p className="text-xs text-slate-400 p-2 text-center">Loading team members...</p>
              )}
            </div>
          )}

          {selectedMemberIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedMemberIds.map((id) => {
                const member = allMembers.find((m) => m.id === id)
                if (!member) return null
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded-md text-xs font-medium"
                  >
                    #{member.memberNumber} {member.name}
                    <button
                      type="button"
                      onClick={() => toggleMember(id)}
                      className="hover:text-white font-bold ml-0.5"
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
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
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
