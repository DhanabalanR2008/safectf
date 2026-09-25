export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse max-w-5xl">
      <div className="h-8 w-48 bg-slate-800 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-44 bg-slate-900 border border-slate-800 rounded-xl p-5" />
        <div className="h-44 bg-slate-900 border border-slate-800 rounded-xl p-5" />
      </div>
      <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl p-5" />
    </div>
  )
}
