import SECFinancialPortal from '@/components/sec/SECFinancialPortal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SEC OSO Financial Management Portal',
  description:
    'Legacy SEC Office of Support Operations financial intelligence — budget execution, OIG compliance, AI analyst, and live intelligence feed.',
}

export const revalidate = 14400

// Legacy SEC-only portal. The any-agency portal is at the root URL (/).
export default function SecCFOPage() {
  return <SECFinancialPortal />
}
