import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export default async function ImAdminLoginPage() {
  const session = await auth()

  // If already logged in:
  if (session) {
    if (session.user.role === 'ADMIN') {
      // If admin clicks /imadminlogin in the browser address bar, directly open Admin panel!
      redirect('/admin')
    } else {
      // If regular member visits it while logged in, redirect to dashboard
      redirect('/dashboard')
    }
  }

  // If not logged in, render the login form
  return <LoginForm />
}
