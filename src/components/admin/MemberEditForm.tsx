'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Save, AlertTriangle } from 'lucide-react'

interface Member {
  id: string
  memberNumber: number
  name: string
  email: string | null
  user?: {
    id: string
    email: string
    role: string
    status: string
  } | null
}

export function MemberEditForm({
  member,
  isNew,
}: {
  member: Member | null
  isNew: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(member?.name ?? '')
  const [email, setEmail] = useState(member?.user?.email ?? '')
  const [password, setPassword] = useState('')
  const [memberNumber, setMemberNumber] = useState(
    member?.memberNumber ? String(member.memberNumber) : ''
  )
  const [role, setRole] = useState(member?.user?.role ?? 'MEMBER')
  const [status, setStatus] = useState(member?.user?.status ?? 'ACTIVE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const body: Record<string, unknown> = { name, email, role, status }
      if (password) body.password = password
      if (isNew) {
        body.memberNumber = parseInt(memberNumber)
        body.password = password // required for new
      }

      const url = isNew
        ? '/api/admin/members'
        : `/api/admin/members/${member!.id}`
      const method = isNew ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save member')
        return
      }

      setSuccess(isNew ? 'Member created successfully!' : 'Member updated successfully!')
      setPassword('')

      if (isNew) {
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        {isNew && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Member Number *</label>
            <select
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Select member slot</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>Member #{n}</option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Karthik"
          required
          maxLength={100}
        />

        <Input
          label="Email address *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="member@example.com"
          required
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-300">
            {isNew ? 'Password *' : 'New Password'}
            {!isNew && (
              <span className="text-slate-500 font-normal"> (leave blank to keep current)</span>
            )}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isNew ? 'Minimum 8 characters' : 'Enter new password'}
            required={isNew}
            minLength={8}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Account Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>

        {!isNew && status === 'DISABLED' && (
          <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-300">Disabling this account will prevent the member from logging in.</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      <Button type="submit" isLoading={loading} size="lg">
        <Save className="w-4 h-4" />
        {isNew ? 'Create Member' : 'Save Changes'}
      </Button>
    </form>
  )
}
