import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        role={session.user.role}
        memberName={session.user.memberName}
        memberNumber={session.user.memberNumber}
        email={session.user.email ?? ''}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav role={session.user.role} memberName={session.user.memberName} />
        <main className="flex-1 p-5 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
