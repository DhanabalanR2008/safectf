import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-700">{label}</label>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-900
            placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
