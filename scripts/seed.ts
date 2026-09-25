import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding SafeCTF database...')

  // Create admin member slot (Member #0 = Admin, not counted in the 6)
  // Admin account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@safectf.local'
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
  const adminName = process.env.ADMIN_NAME || 'Admin'

  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } })

  if (!existingAdmin) {
    // Create admin member
    const adminMember = await db.member.upsert({
      where: { memberNumber: 0 },
      update: {},
      create: {
        memberNumber: 0,
        name: adminName,
        email: adminEmail,
      },
    })

    await db.user.create({
      data: {
        email: adminEmail,
        passwordHash: await hash(adminPassword, 12),
        role: 'ADMIN',
        status: 'ACTIVE',
        memberId: adminMember.id,
      },
    })

    console.log(`✅ Created admin account: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log('   ⚠️  Change this password immediately after first login!')
  } else {
    console.log(`ℹ️  Admin account already exists: ${adminEmail}`)
  }

  console.log('\n✅ Seeding complete!')
  console.log('\nNext steps:')
  console.log('  1. Log in at http://localhost:3000/login')
  console.log('  2. Go to Admin Panel → Add 6 team members')
  console.log('  3. Change admin password')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
