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
  if (!session || session.user?.role !== 'ADMIN') {
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

    const member = await db.member.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Update member name and email
    const memberUpdates: Record<string, unknown> = {}
    if (parsed.data.name) memberUpdates.name = parsed.data.name
    if (parsed.data.email) memberUpdates.email = parsed.data.email.toLowerCase().trim()

    if (Object.keys(memberUpdates).length > 0) {
      await db.member.update({ where: { id: member.id }, data: memberUpdates })
    }

    // Update or create linked User ONLY for this specific member
    if (member.user) {
      const userUpdates: Record<string, unknown> = {}
      if (parsed.data.email) userUpdates.email = parsed.data.email.toLowerCase().trim()
      if (parsed.data.role) userUpdates.role = parsed.data.role
      if (parsed.data.status) userUpdates.status = parsed.data.status
      if (parsed.data.password) {
        userUpdates.passwordHash = await hash(parsed.data.password, 12)
      }

      if (Object.keys(userUpdates).length > 0) {
        await db.user.update({ where: { id: member.user.id }, data: userUpdates })
      }
    } else if (parsed.data.email && parsed.data.password) {
      const passwordHash = await hash(parsed.data.password, 12)
      await db.user.create({
        data: {
          email: parsed.data.email.toLowerCase().trim(),
          passwordHash,
          role: parsed.data.role || 'MEMBER',
          status: parsed.data.status || 'ACTIVE',
          memberId: member.id,
        },
      })
    }

    const updated = await db.member.findUnique({
      where: { id: member.id },
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const member = await db.member.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Protect primary Admin account (slot 0)
    if (member.memberNumber === 0) {
      return NextResponse.json(
        { error: 'Cannot delete the primary Administrator account.' },
        { status: 400 }
      )
    }

    // 1. Delete associated attendances
    await db.attendance.deleteMany({
      where: { memberId: id },
    })

    // 2. Delete user account if linked
    if (member.user) {
      await db.user.delete({
        where: { id: member.user.id },
      })
    }

    // 3. Delete the member record
    await db.member.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true, message: `Member ${member.name} deleted successfully.` })
  } catch (error) {
    console.error('DELETE /api/admin/members/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
