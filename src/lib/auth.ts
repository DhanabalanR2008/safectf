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
      async authorize(credentials, request) {
        // Rate limiting
        const headersList = await headers()
        const ip =
          headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          headersList.get('x-real-ip') ??
          'unknown'

        const { allowed } = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)
        if (!allowed) {
          throw new Error('Too many login attempts. Please try again later.')
        }

        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          // Generic error - don't reveal what failed
          return null
        }

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          include: { member: true },
        })

        // Generic error - don't reveal if account exists
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
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.memberId = user.memberId
        token.memberName = user.memberName
        token.memberNumber = user.memberNumber
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.memberId = (token.memberId as string) ?? null
      session.user.memberName = (token.memberName as string) ?? null
      session.user.memberNumber = (token.memberNumber as number) ?? null
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
  cookies: {
    sessionToken: {
      name: 'safectf-session',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  trustHost: true,
})
