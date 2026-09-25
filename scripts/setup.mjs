#!/usr/bin/env node
/**
 * SafeCTF Setup Script
 * Validates environment, runs Prisma migration, and seeds the admin account.
 * Run: node scripts/setup.mjs
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const ENV_PATH = path.join(ROOT, '.env.local')

function readEnv() {
  const content = fs.readFileSync(ENV_PATH, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_]+)="?(.+?)"?\s*$/)
    if (match) env[match[1]] = match[2]
  }
  return env
}

function writeEnvVar(key, value) {
  let content = fs.readFileSync(ENV_PATH, 'utf8')
  const pattern = new RegExp(`^${key}=.*$`, 'm')
  if (pattern.test(content)) {
    content = content.replace(pattern, `${key}="${value}"`)
  } else {
    content += `\n${key}="${value}"\n`
  }
  fs.writeFileSync(ENV_PATH, content)
}

function run(cmd, opts = {}) {
  console.log(`\n▶ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts })
}

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function main() {
  console.log('\n╔═══════════════════════════════════════╗')
  console.log('║        SafeCTF Setup Wizard            ║')
  console.log('╚═══════════════════════════════════════╝\n')

  const env = readEnv()

  // Step 1 — DATABASE_URL
  let dbUrl = env.DATABASE_URL
  if (!dbUrl || dbUrl.includes('placeholder')) {
    console.log('📦  Database Setup')
    console.log('─'.repeat(50))
    console.log('  1. Go to https://supabase.com → New project (free)')
    console.log('  2. Project Settings → Database → Connection string')
    console.log('  3. Select "Transaction pooler" tab (port 6543)')
    console.log('  4. Copy the URI and paste it below\n')
    dbUrl = await ask('  Paste your Supabase DATABASE_URL: ')
    if (!dbUrl || !dbUrl.startsWith('postgresql://')) {
      console.error('❌  Invalid DATABASE_URL. Must start with postgresql://')
      process.exit(1)
    }
    writeEnvVar('DATABASE_URL', dbUrl)
    process.env.DATABASE_URL = dbUrl
    console.log('✅  DATABASE_URL saved\n')
  } else {
    process.env.DATABASE_URL = dbUrl
    console.log(`✅  DATABASE_URL already configured\n`)
  }

  // Step 2 — Run Prisma migration
  console.log('📐  Running database migration...')
  run('npx prisma migrate deploy')
  console.log('✅  Migration complete\n')

  // Step 3 — Seed admin
  console.log('🌱  Seeding admin account...')
  run('npm run seed')
  console.log('✅  Seed complete\n')

  console.log('═'.repeat(50))
  console.log('🎉  Setup complete!')
  console.log('  Admin email:    admin@safectf.local')
  console.log('  Admin password: ChangeMe123!')
  console.log('  ⚠️  Change this password immediately after first login!')
  console.log('═'.repeat(50))
}

main().catch((e) => {
  console.error('❌  Setup failed:', e.message)
  process.exit(1)
})
