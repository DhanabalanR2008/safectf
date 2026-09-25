type BadgeVariant = 'attending' | 'maybe' | 'not-attending' | 'no-response' | 'admin' | 'member' | 'active' | 'disabled' | 'default'

const variantStyles: Record<BadgeVariant, string> = {
  attending: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  maybe: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'not-attending': 'bg-red-500/15 text-red-400 border-red-500/30',
  'no-response': 'bg-slate-700/50 text-slate-400 border-slate-600/30',
  admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  member: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  disabled: 'bg-slate-700/50 text-slate-500 border-slate-600/30',
  default: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
}

export function Badge({ variant = 'default', children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variantStyles[variant]}`}>
      {children}
    </span>
  )
}
