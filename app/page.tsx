import SECFinancialPortal from '@/components/sec/SECFinancialPortal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SEC OSO Financial Management Portal',
  description: 'Live SEC OSO financial intelligence — budget execution, OIG compliance, AI analyst, and live intelligence feed.',
  icons: { icon: '/favicon.svg' },
}

export const revalidate = 14400

export default function RootPage() {
  return <SECFinancialPortal />
}
