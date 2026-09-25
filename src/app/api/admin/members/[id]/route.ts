import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { memberUpdateSchema } from '@/lib/validations'
import { hash } from 'bcryptjs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = memberUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Find the member
    const member = await db.member.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Update member name
    const memberUpdates: Record<string, unknown> = {}
    if (parsed.data.name) memberUpdates.name = parsed.data.name
    if (parsed.data.email) memberUpdates.email = parsed.data.email

    if (Object.keys(memberUpdates).length > 0) {
      await db.member.update({ where: { id }, data: memberUpdates })
    }

    // Update user if linked
    if (member.user) {
      const userUpdates: Record<string, unknown> = {}
      if (parsed.data.email) userUpdates.email = parsed.data.email
      if (parsed.data.role) userUpdates.role = parsed.data.role
      if (parsed.data.status) userUpdates.status = parsed.data.status
      if (parsed.data.password) {
        userUpdates.passwordHash = await hash(parsed.data.password, 12)
      }

      if (Object.keys(userUpdates).length > 0) {
        await db.user.update({ where: { id: member.user.id }, data: userUpdates })
      }
    }

    const updated = await db.member.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, status: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/admin/members/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
