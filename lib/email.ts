import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured')
    throw new Error('Email service not configured')
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Failed to send email:', error)
      throw new Error(`Email send failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Email service error:', error)
    throw error
  }
}

export function getTrialExpiryEmail7Days(userName: string, trialEndDate: string) {
  return {
    subject: 'Masa uji coba berakhir dalam 7 hari',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af;">Hai ${userName},</h2>
        <p>Masa uji coba Premium Anda akan berakhir dalam <strong>7 hari</strong> pada ${trialEndDate}.</p>
        <p>Untuk terus menikmati fitur Premium:</p>
        <ul>
          <li>Properti tanpa batas</li>
          <li>20 gambar per properti</li>
          <li>Listing unggulan</li>
          <li>Dukungan prioritas</li>
        </ul>
        <a href="${process.env.NEXTAUTH_URL}/langganan" 
           style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Upgrade Sekarang
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Terima kasih telah menggunakan layanan kami!
        </p>
      </div>
    `,
  }
}

export function getTrialExpiryEmail1Day(userName: string, trialEndDate: string) {
  return {
    subject: 'Masa uji coba berakhir besok!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">Hai ${userName},</h2>
        <p><strong>Perhatian!</strong> Masa uji coba Premium Anda akan berakhir <strong>besok</strong> pada ${trialEndDate}.</p>
        <p>Setelah masa uji coba berakhir, Anda akan memiliki periode grace 3 hari sebelum akun dikembalikan ke paket Gratis.</p>
        <p><strong>Paket Gratis hanya memungkinkan:</strong></p>
        <ul>
          <li>1 properti</li>
          <li>5 gambar per properti</li>
          <li>Tanpa listing unggulan</li>
        </ul>
        <a href="${process.env.NEXTAUTH_URL}/langganan" 
           style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Upgrade Hari Ini
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Jangan lewatkan fitur Premium!
        </p>
      </div>
    `,
  }
}

export function getTrialExpiredEmail(userName: string, gracePeriodEndDate: string) {
  return {
    subject: 'Masa uji coba telah berakhir - Grace Period Aktif',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">Hai ${userName},</h2>
        <p>Masa uji coba Premium Anda telah berakhir.</p>
        <p><strong>Grace Period:</strong> Anda memiliki hingga ${gracePeriodEndDate} untuk upgrade sebelum akun dikembalikan ke paket Gratis.</p>
        <p>Setelah grace period berakhir:</p>
        <ul>
          <li>Properti dibatasi menjadi 1</li>
          <li>Gambar dibatasi menjadi 5 per properti</li>
          <li>Listing unggulan dinonaktifkan</li>
        </ul>
        <a href="${process.env.NEXTAUTH_URL}/langganan" 
           style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Upgrade Sekarang
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Upgrade kapan saja untuk mengaktifkan kembali fitur Premium.
        </p>
      </div>
    `,
  }
}
