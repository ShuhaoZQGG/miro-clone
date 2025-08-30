import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TestDashboard } from '@/components/TestDashboard'
import { PerformanceOverlay } from '@/components/PerformanceOverlay'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Miro Clone - Collaborative Whiteboard',
  description: 'A collaborative online whiteboard platform for visual collaboration and brainstorming',
  keywords: ['whiteboard', 'collaboration', 'brainstorming', 'visual', 'team'],
  authors: [{ name: 'Shuhao Zhang' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <AuthProvider>
          {children}
          <TestDashboard />
          <PerformanceOverlay />
        </AuthProvider>
      </body>
    </html>
  )
}