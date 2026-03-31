import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AuraBrain-Pro | Local-First Growth Engine',
  description: 'Track your growth, bridge studies with inspiration, and weave your stories.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#030405', color: 'white', minHeight: '100vh', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
