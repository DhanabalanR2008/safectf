import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SafeCTF',
  description: 'Clean, minimal CTF management for cybersecurity teams',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 antialiased min-h-screen">{children}</body>
    </html>
  )
}
