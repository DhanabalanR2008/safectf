import { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      memberId: string | null
      memberName: string | null
      memberNumber: number | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: string
    memberId: string | null
    memberName: string | null
    memberNumber: number | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    memberId: string | null
    memberName: string | null
    memberNumber: number | null
  }
}
