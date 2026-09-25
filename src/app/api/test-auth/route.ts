import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { compare } from 'bcryptjs'

export async function GET() {
  try {
    const user = await db.user.findUnique({
      where: { email: 'admin@safectf.local' },
      include: { member: true },
    })

    if (!user) {
      return NextResponse.json({
        ok: false,
        error: 'User admin@safectf.local not found in database via Prisma',
      })
    }

    const passwordMatches = await compare('ChangeMe123!', user.passwordHash)

    return NextResponse.json({
      ok: true,
      userFound: true,
      email: user.email,
      role: user.role,
      status: user.status,
      member: user.member,
      passwordMatches,
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
