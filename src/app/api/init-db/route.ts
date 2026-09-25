import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

const STATEMENTS = [
  // Enums
  `DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DISABLED'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN CREATE TYPE "AttendanceStatus" AS ENUM ('ATTENDING', 'MAYBE', 'NOT_ATTENDING', 'NO_RESPONSE'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN CREATE TYPE "CtfSource" AS ENUM ('UNSTOP', 'CTFTIME', 'MANUAL'); EXCEPTION WHEN duplicate_object THEN null; END $$`,

  // Member table
  `CREATE TABLE IF NOT EXISTS "Member" (
    "id" TEXT NOT NULL,
    "memberNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
  )`,

  // User table
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  )`,

  // Ctf table
  `CREATE TABLE IF NOT EXISTS "Ctf" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "CtfSource" NOT NULL DEFAULT 'MANUAL',
    "sourceUrl" TEXT,
    "ctfUrl" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "registrationDeadline" TIMESTAMP(3),
    "teamSize" INTEGER,
    "description" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reminderSentAt" TIMESTAMP(3),
    CONSTRAINT "Ctf_pkey" PRIMARY KEY ("id")
  )`,

  // Attendance table
  `CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" TEXT NOT NULL,
    "ctfId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'NO_RESPONSE',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
  )`,

  // Indices
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_memberId_key" ON "User"("memberId")`,
  `CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email")`,
  `CREATE INDEX IF NOT EXISTS "User_memberId_idx" ON "User"("memberId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Member_memberNumber_key" ON "Member"("memberNumber")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Member_email_key" ON "Member"("email")`,
  `CREATE INDEX IF NOT EXISTS "Ctf_startAt_idx" ON "Ctf"("startAt")`,
  `CREATE INDEX IF NOT EXISTS "Ctf_createdByUserId_idx" ON "Ctf"("createdByUserId")`,
  `CREATE INDEX IF NOT EXISTS "Attendance_ctfId_idx" ON "Attendance"("ctfId")`,
  `CREATE INDEX IF NOT EXISTS "Attendance_memberId_idx" ON "Attendance"("memberId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_ctfId_memberId_key" ON "Attendance"("ctfId", "memberId")`,

  // Foreign keys
  `DO $$ BEGIN ALTER TABLE "User" ADD CONSTRAINT "User_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN ALTER TABLE "Ctf" ADD CONSTRAINT "Ctf_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_ctfId_fkey" FOREIGN KEY ("ctfId") REFERENCES "Ctf"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
]

export async function GET() {
  try {
    // 1. Execute each DDL statement sequentially
    for (const sql of STATEMENTS) {
      await db.$executeRawUnsafe(sql)
    }

    // 2. Admin account setup
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@safectf.local'
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
    const adminName = process.env.ADMIN_NAME || 'Admin'

    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail },
    })

    if (!existingAdmin) {
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

      // Create admin user with bcrypt cost 12
      const passwordHash = await hash(adminPassword, 12)
      await db.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          memberId: adminMember.id,
        },
      })
    }

    // 3. Pre-create standard 6 member slots
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
      message: 'SafeCTF database tables created, admin account initialized, and 6 member slots configured successfully!',
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
