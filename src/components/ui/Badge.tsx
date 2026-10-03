type BadgeVariant = 'attending' | 'maybe' | 'not-attending' | 'no-response' | 'admin' | 'member' | 'active' | 'disabled' | 'default'

const variantStyles: Record<BadgeVariant, string> = {
  attending: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  maybe: 'bg-amber-50 text-amber-700 border-amber-200/60',
  'not-attending': 'bg-rose-50 text-rose-700 border-rose-200/60',
  'no-response': 'bg-slate-100 text-slate-600 border-slate-200',
  admin: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
  member: 'bg-slate-100 text-slate-700 border-slate-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  disabled: 'bg-slate-100 text-slate-400 border-slate-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
}

export function Badge({ variant = 'default', children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variantStyles[variant]}`}>
      {children}
    </span>
  )
}
