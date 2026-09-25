import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const members = await db.member.findMany({
      orderBy: { memberNumber: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, role: true, status: true },
        },
      },
    })
    return NextResponse.json(members)
  } catch (error) {
    console.error('GET /api/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
