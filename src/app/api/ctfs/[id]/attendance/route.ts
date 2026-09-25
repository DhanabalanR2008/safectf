import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { attendanceSchema } from '@/lib/validations'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // memberId ALWAYS comes from session - never from body
  const memberId = session.user.memberId
  if (!memberId) {
    return NextResponse.json(
      { error: 'No member profile linked to your account' },
      { status: 400 }
    )
  }

  const { id: ctfId } = await params

  try {
    const body = await req.json()
    const parsed = attendanceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Verify CTF exists
    const ctf = await db.ctf.findUnique({ where: { id: ctfId } })
    if (!ctf) {
      return NextResponse.json({ error: 'CTF not found' }, { status: 404 })
    }

    // Upsert - prevents duplicates
    const attendance = await db.attendance.upsert({
      where: { ctfId_memberId: { ctfId, memberId } },
      update: { status: parsed.data.status },
      create: { ctfId, memberId, status: parsed.data.status },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('POST /api/ctfs/[id]/attendance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
