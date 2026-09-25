import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { memberCreateSchema } from '@/lib/validations'
import { hash } from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const members = await db.member.findMany({
      orderBy: { memberNumber: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, role: true, status: true, createdAt: true },
        },
      },
    })
    return NextResponse.json(members)
  } catch (error) {
    console.error('GET /api/admin/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = memberCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Check member number not already taken
    const existing = await db.member.findUnique({
      where: { memberNumber: parsed.data.memberNumber },
    })
    if (existing) {
      return NextResponse.json(
        { error: `Member ${parsed.data.memberNumber} slot is already taken` },
        { status: 409 }
      )
    }

    // Check email not taken
    const existingUser = await db.user.findUnique({
      where: { email: parsed.data.email },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      )
    }

    const passwordHash = await hash(parsed.data.password, 12)

    // Create member + user in a transaction
    const result = await db.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          memberNumber: parsed.data.memberNumber,
          name: parsed.data.name,
          email: parsed.data.email,
        },
      })

      const user = await tx.user.create({
        data: {
          email: parsed.data.email,
          passwordHash,
          role: parsed.data.role,
          memberId: member.id,
          status: 'ACTIVE',
        },
      })

      return { member, user }
    })

    return NextResponse.json(
      {
        member: result.member,
        userId: result.user.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/admin/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
