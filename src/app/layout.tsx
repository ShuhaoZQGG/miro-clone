import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Miro Clone - Collaborative Whiteboard',
  description: 'A collaborative online whiteboard platform for visual collaboration and brainstorming',
  keywords: ['whiteboard', 'collaboration', 'brainstorming', 'visual', 'team'],
  authors: [{ name: 'Shuhao Zhang' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        {children}
      </body>
    </html>
  )
}