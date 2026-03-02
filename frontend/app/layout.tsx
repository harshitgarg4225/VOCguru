import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'PainSolver - Turn Customer Feedback into Revenue',
  description: 'AI-powered feedback management that ties customer requests to revenue. Build what matters most.',
  keywords: ['feedback management', 'product roadmap', 'customer feedback', 'feature prioritization', 'Canny alternative'],
  openGraph: {
    title: 'PainSolver - Turn Customer Feedback into Revenue',
    description: 'AI-powered feedback management that ties customer requests to revenue.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
