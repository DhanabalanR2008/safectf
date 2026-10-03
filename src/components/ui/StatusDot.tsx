type Status = 'ATTENDING' | 'MAYBE' | 'NOT_ATTENDING' | 'NO_RESPONSE'

const dotColors: Record<Status, string> = {
  ATTENDING: 'bg-emerald-500',
  MAYBE: 'bg-amber-500',
  NOT_ATTENDING: 'bg-rose-500',
  NO_RESPONSE: 'bg-slate-300',
}

const labels: Record<Status, string> = {
  ATTENDING: 'Attending',
  MAYBE: 'Maybe',
  NOT_ATTENDING: 'Not attending',
  NO_RESPONSE: 'No response',
}

export function StatusDot({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${dotColors[status]}`} />
      <span className="text-xs font-medium text-slate-600">{labels[status]}</span>
    </span>
  )
}
