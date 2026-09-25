'use client'

import { useState } from 'react'
import { Shield, ExternalLink, FileText, Bot } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CtfForm } from '@/components/ctf/CtfForm'
import { AiImportPanel } from '@/components/ctf/AiImportPanel'

type Source = 'UNSTOP' | 'CTFTIME' | 'MANUAL' | null
type ManualMode = 'form' | 'ai' | null

export default function AddCtfPage() {
  const [source, setSource] = useState<Source>(null)
  const [manualMode, setManualMode] = useState<ManualMode>(null)
  const [aiPrefill, setAiPrefill] = useState<Record<string, unknown> | null>(null)

  function handleSourceSelect(s: Source) {
    setSource(s)
    setManualMode(null)
    setAiPrefill(null)
    if (s === 'UNSTOP') window.open('https://unstop.com', '_blank', 'noopener,noreferrer')
    if (s === 'CTFTIME') window.open('https://ctftime.org', '_blank', 'noopener,noreferrer')
  }

  if (source === 'MANUAL' && manualMode === 'ai') {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Import</h1>
          <p className="text-slate-400 text-sm mt-1">Paste a CTF description and AI will extract the details</p>
        </div>
        <AiImportPanel
          onExtracted={(data) => {
            setAiPrefill(data)
            setManualMode('form')
          }}
          onBack={() => setManualMode(null)}
        />
      </div>
    )
  }

  if (source && (source !== 'MANUAL' || manualMode === 'form')) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Add CTF</h1>
          <p className="text-slate-400 text-sm mt-1">
            {source === 'UNSTOP' && 'Import from Unstop'}
            {source === 'CTFTIME' && 'Import from CTFtime'}
            {source === 'MANUAL' && 'Manual Entry'}
          </p>
        </div>
        <CtfForm
          source={source}
          prefill={aiPrefill}
          onBack={() => {
            setSource(null)
            setManualMode(null)
            setAiPrefill(null)
          }}
        />
      </div>
    )
  }

  if (source === 'MANUAL' && !manualMode) {
    return (
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Add CTF &mdash; Manual</h1>
          <p className="text-slate-400 text-sm mt-1">Choose how to enter CTF details</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => setManualMode('form')}
            className="flex items-start gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800 transition-all text-left"
          >
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Manual Form</p>
              <p className="text-sm text-slate-400 mt-1">Fill in CTF details using the form</p>
            </div>
          </button>
          <button
            onClick={() => setManualMode('ai')}
            className="flex items-start gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800 transition-all text-left"
          >
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-white">AI Import</p>
              <p className="text-sm text-slate-400 mt-1">Paste a CTF description and AI extracts the details</p>
            </div>
          </button>
        </div>
        <Button variant="ghost" onClick={() => setSource(null)}>← Back</Button>
      </div>
    )
  }

  // Source picker
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Add CTF</h1>
        <p className="text-slate-400 text-sm mt-1">How are you adding this CTF?</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {[{ id: 'UNSTOP' as const, label: 'UNSTOP', desc: 'Open Unstop, then return to enter details', url: 'unstop.com', icon: ExternalLink, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { id: 'CTFTIME' as const, label: 'CTFTIME', desc: 'Open CTFtime, then return to enter details', url: 'ctftime.org', icon: ExternalLink, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { id: 'MANUAL' as const, label: 'MANUAL', desc: 'Enter details manually or use AI Import', url: null, icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        ].map((opt) => {
          const Icon = opt.icon
          return (
            <button
              key={opt.id}
              onClick={() => handleSourceSelect(opt.id)}
              className="flex items-start gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500/40 hover:bg-slate-800 transition-all text-left"
            >
              <div className={`p-2 rounded-lg ${opt.bg}`}>
                <Icon className={`w-5 h-5 ${opt.color}`} />
              </div>
              <div>
                <p className="font-semibold text-white">{opt.label}</p>
                <p className="text-sm text-slate-400 mt-1">{opt.desc}</p>
                {opt.url && (
                  <p className="text-xs text-slate-600 mt-1">{opt.url} will open in a new tab</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
