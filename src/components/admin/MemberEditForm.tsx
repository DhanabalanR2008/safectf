'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Save, AlertTriangle, Trash2, Eye, EyeOff } from 'lucide-react'

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
  const [email, setEmail] = useState(member?.user?.email ?? member?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [memberNumber, setMemberNumber] = useState(
    member?.memberNumber !== undefined ? String(member.memberNumber) : ''
  )
  const [role, setRole] = useState(member?.user?.role ?? 'MEMBER')
  const [status, setStatus] = useState(member?.user?.status ?? 'ACTIVE')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
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

  async function handleDelete() {
    if (!member) return
    const confirmed = window.confirm(
      `Are you sure you want to delete member #${member.memberNumber} (${member.name})? This will delete their account and attendances.`
    )
    if (!confirmed) return

    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to delete member')
        setDeleting(false)
        return
      }
      router.push('/admin')
      router.refresh()
    } catch {
      setError('An unexpected error occurred while deleting.')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        {isNew && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Member Slot *</label>
            <select
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            {isNew ? 'Password *' : 'New Password'}
            {!isNew && (
              <span className="text-slate-400 font-normal"> (leave blank to keep current)</span>
            )}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isNew ? 'Minimum 8 characters' : 'Enter new password'}
              required={isNew}
              minLength={8}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1 cursor-pointer focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-slate-500" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Account Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            >
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>

        {!isNew && status === 'DISABLED' && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">Disabling this account will prevent the member from logging in.</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <Button type="submit" isLoading={loading} size="lg">
          <Save className="w-4 h-4" />
          {isNew ? 'Create Member' : 'Save Changes'}
        </Button>

        {!isNew && member && member.memberNumber !== 0 && (
          <Button
            type="button"
            variant="danger"
            size="lg"
            isLoading={deleting}
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
            Delete Member
          </Button>
        )}
      </div>
    </form>
  )
}
