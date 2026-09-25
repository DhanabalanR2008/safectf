'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sparkles, ArrowLeft } from 'lucide-react'

interface AiImportPanelProps {
  onExtracted: (data: Record<string, unknown>) => void
  onBack: () => void
}

export function AiImportPanel({ onExtracted, onBack }: AiImportPanelProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleExtract() {
    if (!text.trim()) {
      setError('Please paste a CTF description first.')
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
        setError('Could not extract CTF details. Please try a more detailed description or use the manual form.')
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">
            Paste CTF Description
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Example:\n\n"CyberSphere CTF 2026 is a 24-hour online CTF starting October 10, 2026 at 7 PM IST and ending October 11 at 7 PM IST. Teams can have up to 6 members. Registration closes October 9."`}
            rows={8}
            maxLength={5000}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y font-mono text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">{text.length} / 5000 characters</p>
        </div>

        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
          <p className="text-xs text-purple-300">
            <strong>Note:</strong> AI will extract details and pre-fill the form. You must review and click{' '}
            <strong>Save CTF</strong> to save — nothing is saved automatically.
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
        <Button onClick={handleExtract} isLoading={loading} size="lg">
          <Sparkles className="w-4 h-4" />
          Extract Details
        </Button>
      </div>
    </div>
  )
}
