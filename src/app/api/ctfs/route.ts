import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ctfCreateSchema } from '@/lib/validations'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ctfs = await db.ctf.findMany({
      orderBy: { startAt: 'asc' },
      include: {
        createdBy: {
          include: { member: { select: { name: true } } },
        },
        attendance: {
          include: {
            member: { select: { id: true, name: true, memberNumber: true } },
          },
        },
      },
    })
    return NextResponse.json(ctfs)
  } catch (error) {
    console.error('GET /api/ctfs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = ctfCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // createdByUserId ALWAYS comes from server session - never from body
    const ctf = await db.ctf.create({
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
        createdByUserId: session.user.id, // from session only
      },
      include: {
        createdBy: {
          include: { member: { select: { name: true } } },
        },
      },
    })

    // Create attendance records
    const members = await db.member.findMany()
    const chosenIds = new Set(parsed.data.memberIds || [])
    if (members.length > 0) {
      await db.attendance.createMany({
        data: members.map((m) => ({
          ctfId: ctf.id,
          memberId: m.id,
          status: (chosenIds.has(m.id) ? 'ATTENDING' : 'NO_RESPONSE') as 'ATTENDING' | 'NO_RESPONSE',
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json(ctf, { status: 201 })
  } catch (error) {
    console.error('POST /api/ctfs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
