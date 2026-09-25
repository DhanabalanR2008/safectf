import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

export async function GET() {
  try {
    // Check if admin user already exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@safectf.local'
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
    const adminName = process.env.ADMIN_NAME || 'Admin'

    // Try finding admin user
    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail },
    }).catch(() => null)

    if (existingAdmin) {
      return NextResponse.json({
        ok: true,
        message: 'SafeCTF database is already initialized.',
        adminEmail,
      })
    }

    // Upsert admin member
    const adminMember = await db.member.upsert({
      where: { memberNumber: 0 },
      update: {},
      create: {
        memberNumber: 0,
        name: adminName,
        email: adminEmail,
      },
    })

    // Create admin user
    await db.user.create({
      data: {
        email: adminEmail,
        passwordHash: await hash(adminPassword, 12),
        role: 'ADMIN',
        status: 'ACTIVE',
        memberId: adminMember.id,
      },
    })

    // Pre-create standard member slots if not existing
    const defaultMembers = [
      { memberNumber: 1, name: 'Boon' },
      { memberNumber: 2, name: 'Arun' },
      { memberNumber: 3, name: 'Karthik' },
      { memberNumber: 4, name: 'Rahul' },
      { memberNumber: 5, name: 'Vijay' },
      { memberNumber: 6, name: 'Ajay' },
    ]

    for (const m of defaultMembers) {
      await db.member.upsert({
        where: { memberNumber: m.memberNumber },
        update: {},
        create: {
          memberNumber: m.memberNumber,
          name: m.name,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'SafeCTF database initialized successfully! 6 member slots and admin account created.',
      adminEmail,
      adminPassword,
    })
  } catch (error: any) {
    console.error('Database init error:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Database initialization error',
        details: error?.message || String(error),
      },
      { status: 500 }
    )
  }
}
