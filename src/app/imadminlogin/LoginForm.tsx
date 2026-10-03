'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Suspense } from 'react'

function LoginFormContent() {
  const searchParams = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        identifier: identifier.trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid Roll No or Password. Please try again.')
        setLoading(false)
      } else {
        // Full page navigation to refresh session cookies
        window.location.href = callbackUrl
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">SafeCTF</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in with your Roll No and Password</p>
        </div>

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Roll No / ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder=""
                  required
                  autoFocus={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent uppercase font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  autoComplete="new-password"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" isLoading={loading} className="w-full" size="lg">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          SafeCTF &mdash; Private CTF management for your team
        </p>
      </div>
    </div>
  )
}

export default function LoginForm() {
  return (
    <Suspense>
      <LoginFormContent />
    </Suspense>
  )
}
