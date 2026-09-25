import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { MemberEditForm } from '@/components/admin/MemberEditForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { id } = await params

  const isNew = id === 'new'

  let member = null
  if (!isNew) {
    member = await db.member.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, status: true } },
      },
    })
    if (!member) notFound()
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {isNew ? 'Add Member' : `Edit Member #${member?.memberNumber}`}
        </h1>
      </div>
      <MemberEditForm member={member} isNew={isNew} />
    </div>
  )
}
