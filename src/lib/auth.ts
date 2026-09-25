import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'
import { loginSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Safe IP extraction
          let ip = 'unknown'
          try {
            const headersList = await headers()
            ip =
              headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
              headersList.get('x-real-ip') ??
              'unknown'
          } catch {
            // Headers not available in this context
          }

          if (ip !== 'unknown') {
            const { allowed } = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
            if (!allowed) {
              throw new Error('Too many login attempts. Please try again later.')
            }
          }

          const parsed = loginSchema.safeParse(credentials)
          if (!parsed.success) {
            return null
          }

          const user = await db.user.findUnique({
            where: { email: parsed.data.email.toLowerCase().trim() },
            include: { member: true },
          })

          if (!user) return null
          if (user.status === 'DISABLED') return null

          const valid = await compare(parsed.data.password, user.passwordHash)
          if (!valid) return null

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            memberId: user.memberId ?? null,
            memberName: user.member?.name ?? null,
            memberNumber: user.member?.memberNumber ?? null,
          }
        } catch (err) {
          console.error('Authorize error:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.memberId = (user as any).memberId
        token.memberName = (user as any).memberName
        token.memberNumber = (user as any).memberNumber
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.memberId = (token.memberId as string) ?? null
        session.user.memberName = (token.memberName as string) ?? null
        session.user.memberNumber = (token.memberNumber as number) ?? null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
})
