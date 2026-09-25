import { NextResponse } from 'next/server'
import { Client } from 'pg'
import { hash } from 'bcryptjs'

const SCHEMA_SQL = `
DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DISABLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "AttendanceStatus" AS ENUM ('ATTENDING', 'MAYBE', 'NOT_ATTENDING', 'NO_RESPONSE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "CtfSource" AS ENUM ('UNSTOP', 'CTFTIME', 'MANUAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Member" (
    "id" TEXT NOT NULL,
    "memberNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Ctf" (
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
);

CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" TEXT NOT NULL,
    "ctfId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'NO_RESPONSE',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_memberId_key" ON "User"("memberId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_memberId_idx" ON "User"("memberId");
CREATE UNIQUE INDEX IF NOT EXISTS "Member_memberNumber_key" ON "Member"("memberNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Member_email_key" ON "Member"("email");
CREATE INDEX IF NOT EXISTS "Ctf_startAt_idx" ON "Ctf"("startAt");
CREATE INDEX IF NOT EXISTS "Ctf_createdByUserId_idx" ON "Ctf"("createdByUserId");
CREATE INDEX IF NOT EXISTS "Attendance_ctfId_idx" ON "Attendance"("ctfId");
CREATE INDEX IF NOT EXISTS "Attendance_memberId_idx" ON "Attendance"("memberId");
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_ctfId_memberId_key" ON "Attendance"("ctfId", "memberId");

DO $$ BEGIN ALTER TABLE "User" ADD CONSTRAINT "User_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Ctf" ADD CONSTRAINT "Ctf_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_ctfId_fkey" FOREIGN KEY ("ctfId") REFERENCES "Ctf"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
`

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()

    // 1. Run all schema DDL statements directly
    await client.query(SCHEMA_SQL)

    // 2. Admin account setup
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@safectf.local').toLowerCase().trim()
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
    const adminName = process.env.ADMIN_NAME || 'Admin'

    const existingUser = await client.query('SELECT id FROM "User" WHERE email = $1', [adminEmail])

    if (existingUser.rows.length === 0) {
      // Upsert Member 0
      const memberRes = await client.query(`
        INSERT INTO "Member" ("id", "memberNumber", "name", "email", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, 0, $1, $2, NOW(), NOW())
        ON CONFLICT ("memberNumber") DO UPDATE SET "name" = $1
        RETURNING "id"
      `, [adminName, adminEmail])

      const memberId = memberRes.rows[0].id
      const passwordHash = await hash(adminPassword, 12)

      await client.query(`
        INSERT INTO "User" ("id", "email", "passwordHash", "role", "status", "memberId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, $2, 'ADMIN', 'ACTIVE', $3, NOW(), NOW())
      `, [adminEmail, passwordHash, memberId])
    }

    // 3. Pre-create standard 6 member slots
    const defaultMembers = [
      { num: 1, name: 'Boon' },
      { num: 2, name: 'Arun' },
      { num: 3, name: 'Karthik' },
      { num: 4, name: 'Rahul' },
      { num: 5, name: 'Vijay' },
      { num: 6, name: 'Ajay' },
    ]

    for (const m of defaultMembers) {
      await client.query(`
        INSERT INTO "Member" ("id", "memberNumber", "name", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())
        ON CONFLICT ("memberNumber") DO NOTHING
      `, [m.num, m.name])
    }

    await client.end()

    return NextResponse.json({
      ok: true,
      message: 'SafeCTF database tables created, admin account initialized, and 6 member slots configured successfully!',
      adminEmail,
      adminPassword,
    })
  } catch (error: any) {
    console.error('Database init error:', error)
    try { await client.end() } catch {}
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
