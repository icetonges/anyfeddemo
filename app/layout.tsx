import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets:  ['latin'],
  weight:   ['400', '600'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title:       'ANY FED | Federal Financial Management Portal',
  description: 'Any-agency federal FM portal — budget lifecycle, accounting, audit, finance operations, internal controls, acquisition, and an AI/ML workbench. DoD & SEC folder data, live USAspending fallback.',
  keywords:    ['federal', 'budget', 'financial management', 'CFO', 'appropriations', 'audit', 'USSGL', 'AI', 'ML'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
