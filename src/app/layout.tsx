import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Order Tracker',
  description: 'Real-time order tracking system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 5000, style: { maxWidth: 400 } }} />
        </AuthProvider>
      </body>
    </html>
  )
}
