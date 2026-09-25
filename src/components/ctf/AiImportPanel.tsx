'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sparkles, ArrowLeft, Link as LinkIcon, FileText } from 'lucide-react'

interface AiImportPanelProps {
  onExtracted: (data: Record<string, unknown>) => void
  onBack: () => void
  initialUrl?: string
}

export function AiImportPanel({ onExtracted, onBack, initialUrl }: AiImportPanelProps) {
  const [tab, setTab] = useState<'url' | 'text'>(initialUrl ? 'url' : 'url')
  const [url, setUrl] = useState(initialUrl ?? '')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleExtractUrl() {
    if (!url.trim()) {
      setError('Please paste an Unstop, CTFtime, or competition URL.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to extract from URL.')
        return
      }

      if (!data.extracted || Object.keys(data.extracted).length === 0) {
        setError('Could not extract details from URL. Try pasting the page text in the Text tab instead.')
        return
      }

      onExtracted(data.extracted)
    } catch {
      setError('An error occurred while fetching the URL.')
    } finally {
      setLoading(false)
    }
  }

  async function handleExtractText() {
    if (!text.trim()) {
      setError('Please paste the CTF description or email content.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/extract-ctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Extraction failed. Please try again.')
        return
      }

      if (!data.extracted || Object.keys(data.extracted).length === 0) {
        setError('Could not extract CTF details. Please try pasting more details.')
        return
      }

      onExtracted(data.extracted)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'url'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          Paste Unstop / CTF Link
        </button>
        <button
          type="button"
          onClick={() => setTab('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'text'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Paste Description / Email
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        {tab === 'url' ? (
          <div className="space-y-3">
            <Input
              label="Competition / Unstop URL *"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://unstop.com/hackathons/cyber-challenge-2026..."
              autoFocus
            />
            <p className="text-xs text-slate-400">
              Paste any URL from <strong>Unstop</strong>, <strong>CTFtime</strong>, or an official competition site. Gemini AI will automatically fetch and extract all competition dates, registration deadline, team size, and rules!
            </p>
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              Paste CTF Description or Email
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Example:\n\n"CyberSphere CTF 2026 is a 24-hour online CTF on Unstop starting October 10, 2026 at 7 PM IST and ending October 11 at 7 PM IST. Max team size: 6. Registration closes October 9."`}
              rows={8}
              maxLength={10000}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y font-mono text-sm"
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1">{text.length} / 10000 characters</p>
          </div>
        )}

        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
          <p className="text-xs text-purple-300">
            ✨ <strong>AI Auto-Import:</strong> AI will parse the details and pre-fill all form fields so you can review and save with 1 click.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          onClick={tab === 'url' ? handleExtractUrl : handleExtractText}
          isLoading={loading}
          size="lg"
        >
          <Sparkles className="w-4 h-4" />
          {tab === 'url' ? 'Auto-Fetch from URL' : 'Extract with AI'}
        </Button>
      </div>
    </div>
  )
}
