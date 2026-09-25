import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendReminderEmails } from '@/lib/email'

export async function POST(
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
        attendance: {
          where: { status: 'NO_RESPONSE' },
          include: {
            member: { select: { name: true, email: true } },
          },
        },
      },
    })

    if (!ctf) {
      return NextResponse.json({ error: 'CTF not found' }, { status: 404 })
    }

    const recipients = ctf.attendance
      .filter((a) => a.member.email)
      .map((a) => ({ name: a.member.name, email: a.member.email! }))

    let emailResult = { errors: [] as string[] }

    if (recipients.length > 0 && process.env.SMTP_USER) {
      emailResult = await sendReminderEmails({
        ctfName: ctf.name,
        startAt: ctf.startAt,
        ctfId: ctf.id,
        recipients,
      })
    }

    // Mark reminder sent
    await db.ctf.update({
      where: { id },
      data: { reminderSentAt: new Date() },
    })

    return NextResponse.json({
      ok: true,
      reminded: recipients.length,
      errors: emailResult.errors,
    })
  } catch (error) {
    console.error('POST /api/ctfs/[id]/remind error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
