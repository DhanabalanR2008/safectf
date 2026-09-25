import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ctfCreateSchema } from '@/lib/validations'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const ctf = await db.ctf.findUnique({
      where: { id },
      include: {
        createdBy: {
          include: { member: { select: { name: true } } },
        },
        attendance: {
          include: {
            member: {
              select: { id: true, name: true, memberNumber: true },
            },
          },
          orderBy: { member: { memberNumber: 'asc' } },
        },
      },
    })

    if (!ctf) {
      return NextResponse.json({ error: 'CTF not found' }, { status: 404 })
    }

    return NextResponse.json(ctf)
  } catch (error) {
    console.error('GET /api/ctfs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const ctf = await db.ctf.findUnique({ where: { id } })
    if (!ctf) {
      return NextResponse.json({ error: 'CTF not found' }, { status: 404 })
    }

    // Only admin or the creator can edit
    if (
      session.user.role !== 'ADMIN' &&
      ctf.createdByUserId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    // Handle reminder flag specially
    if (body.reminderSentAt !== undefined) {
      const updated = await db.ctf.update({
        where: { id },
        data: { reminderSentAt: body.reminderSentAt ? new Date() : null },
      })
      return NextResponse.json(updated)
    }

    const parsed = ctfCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await db.ctf.update({
      where: { id },
      data: {
        name: parsed.data.name,
        source: parsed.data.source,
        sourceUrl: parsed.data.sourceUrl,
        ctfUrl: parsed.data.ctfUrl,
        startAt: new Date(parsed.data.startAt),
        endAt: new Date(parsed.data.endAt),
        registrationDeadline: parsed.data.registrationDeadline
          ? new Date(parsed.data.registrationDeadline)
          : null,
        teamSize: parsed.data.teamSize ?? null,
        description: parsed.data.description,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/ctfs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can delete CTFs
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    await db.ctf.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/ctfs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
