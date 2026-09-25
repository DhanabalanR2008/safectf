import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendReminderEmails({
  ctfName,
  startAt,
  ctfId,
  recipients,
}: {
  ctfName: string
  startAt: Date
  ctfId: string
  recipients: Array<{ name: string; email: string }>
}) {
  const from = process.env.SMTP_FROM || 'SafeCTF <noreply@safectf.local>'
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const ctfUrl = `${appUrl}/ctfs/${ctfId}`

  const startFormatted = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(startAt))

  const errors: string[] = []

  for (const recipient of recipients) {
    if (!recipient.email) continue
    try {
      await transporter.sendMail({
        from,
        to: recipient.email,
        subject: `[SafeCTF] Reminder: ${ctfName} is coming up!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 24px; border-radius: 8px;">
            <h1 style="color: #22d3ee; font-size: 24px; margin-bottom: 8px;">SafeCTF Reminder</h1>
            <p style="color: #94a3b8; margin-bottom: 24px;">Hey ${recipient.name},</p>
            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <h2 style="color: #f1f5f9; margin: 0 0 8px 0; font-size: 20px;">${ctfName}</h2>
              <p style="color: #94a3b8; margin: 0;">Starts: <strong style="color: #22d3ee;">${startFormatted}</strong></p>
            </div>
            <p style="color: #94a3b8;">You haven't marked your attendance yet. Please update your status so the team knows who's participating.</p>
            <a href="${ctfUrl}" style="display: inline-block; background: #22d3ee; color: #0f172a; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">View CTF &amp; Update Attendance</a>
            <p style="color: #475569; font-size: 12px; margin-top: 24px;">This reminder was sent from SafeCTF. Do not reply to this email.</p>
          </div>
        `,
      })
    } catch (err) {
      errors.push(`Failed to send to ${recipient.email}: ${err}`)
    }
  }

  return { errors }
}
