type Status = 'ATTENDING' | 'MAYBE' | 'NOT_ATTENDING' | 'NO_RESPONSE'

const dotColors: Record<Status, string> = {
  ATTENDING: 'bg-emerald-400',
  MAYBE: 'bg-yellow-400',
  NOT_ATTENDING: 'bg-red-400',
  NO_RESPONSE: 'bg-slate-500',
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
      <span className="text-sm text-slate-300">{labels[status]}</span>
    </span>
  )
}
