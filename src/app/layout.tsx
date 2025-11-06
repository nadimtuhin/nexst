import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nexst - Next.js with NestJS Architecture',
  description: 'A Next.js boilerplate with NestJS-style architecture',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
