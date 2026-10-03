import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean
}

export function Card({ children, className = '', padding = true, ...props }: CardProps) {
  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-xl ${padding ? 'p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
