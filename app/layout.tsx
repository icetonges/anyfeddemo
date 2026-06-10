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
  title:       'SEC Financial Management Portal | OSO',
  description: 'U.S. Securities and Exchange Commission — Office of Support Operations.',
  keywords:    ['SEC', 'budget', 'financial management', 'OSO', 'CFO', 'appropriations'],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
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
