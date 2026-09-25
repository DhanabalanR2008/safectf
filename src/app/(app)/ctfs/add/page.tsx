'use client'

import { useState } from 'react'
import { ExternalLink, FileText, Sparkles, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CtfForm } from '@/components/ctf/CtfForm'
import { AiImportPanel } from '@/components/ctf/AiImportPanel'

type Source = 'UNSTOP' | 'CTFTIME' | 'MANUAL' | null
type Mode = 'picker' | 'auto_url' | 'form'

export default function AddCtfPage() {
  const [source, setSource] = useState<Source>(null)
  const [mode, setMode] = useState<Mode>('picker')
  const [aiPrefill, setAiPrefill] = useState<Record<string, unknown> | null>(null)
  const [suggestedUrl, setSuggestedUrl] = useState('')

  function handleSelectSource(selected: Source) {
    setSource(selected)
    setAiPrefill(null)

    if (selected === 'UNSTOP') {
      setSuggestedUrl('https://unstop.com/')
      setMode('auto_url')
    } else if (selected === 'CTFTIME') {
      setSuggestedUrl('https://ctftime.org/')
      setMode('auto_url')
    } else {
      setMode('auto_url')
    }
  }

  // Auto URL / AI Import panel
  if (mode === 'auto_url') {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {source === 'UNSTOP' ? 'Import from Unstop' : source === 'CTFTIME' ? 'Import from CTFtime' : 'Smart CTF Import'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Paste the competition link or details, and AI will auto-extract dates, team size, and descriptions!
          </p>
        </div>

        <AiImportPanel
          initialUrl={suggestedUrl.length > 25 ? suggestedUrl : ''}
          onExtracted={(data) => {
            setAiPrefill(data)
            setMode('form')
          }}
          onBack={() => {
            setMode('picker')
            setSource(null)
          }}
        />

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
          <p className="text-xs text-slate-500">Prefer filling the form manually?</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode('form')}
          >
            <FileText className="w-3.5 h-3.5" />
            Switch to Manual Form
          </Button>
        </div>
      </div>
    )
  }

  // Full Manual Form
  if (mode === 'form' && source) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Add CTF</h1>
          <p className="text-slate-400 text-sm mt-1">
            {source === 'UNSTOP' && 'Unstop Competition'}
            {source === 'CTFTIME' && 'CTFtime Event'}
            {source === 'MANUAL' && 'Manual Entry'}
          </p>
        </div>
        <CtfForm
          source={source}
          prefill={aiPrefill}
          onBack={() => {
            setMode('picker')
            setSource(null)
            setAiPrefill(null)
          }}
        />
      </div>
    )
  }

  // Source selection cards
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Add CTF</h1>
        <p className="text-slate-400 text-sm mt-1">Choose how you want to add this competition:</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          {
            id: 'UNSTOP' as const,
            label: 'Unstop Competition (Auto-Import)',
            desc: 'Paste any Unstop hackathon / CTF link to auto-import dates, team size & details',
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            icon: Globe,
          },
          {
            id: 'CTFTIME' as const,
            label: 'CTFtime (Auto-Import)',
            desc: 'Paste any CTFtime event URL to auto-extract all competition info',
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            icon: ExternalLink,
          },
          {
            id: 'MANUAL' as const,
            label: 'AI Text Import / Manual Form',
            desc: 'Paste a description or fill in the CTF details directly',
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            icon: Sparkles,
          },
        ].map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.id}
              onClick={() => handleSelectSource(opt.id)}
              className="flex items-start gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800/80 transition-all text-left group cursor-pointer"
            >
              <div className={`p-3 rounded-lg ${opt.bg} shrink-0`}>
                <Icon className={`w-5 h-5 ${opt.color}`} />
              </div>
              <div>
                <p className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {opt.label}
                </p>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">{opt.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
