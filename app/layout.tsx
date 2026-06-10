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
  title: {
    default:  'ANY FED | Federal Financial Management Portal',
    template: '%s | ANY FED',
  },
  description:
    'Any-agency federal financial management showcase — budget formulation/enactment/execution, accounting, audit, finance operations, internal controls, acquisition, and a live AI/ML workbench. Folder source data with USAspending live fallback.',
  keywords: [
    'federal financial management', 'budget', 'appropriations', 'USSGL', 'audit',
    'OMB A-11', 'A-123', 'FIAR', 'DoD', 'SEC', 'USAspending', 'AI', 'machine learning',
  ],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cls = [ibmPlexSans.variable, ibmPlexMono.variable].join(' ')
  return (
    <html lang="en" className={cls}>
      <body>{children}</body>
    </html>
  )
}
