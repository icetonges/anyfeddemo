import { Metadata } from 'next'
import SECFinancialPortal from '@/components/sec/SECFinancialPortal'

export const metadata: Metadata = {
  title: 'SEC CFO Intelligence Portal | OSO Financial Management',
  description:
    'Live SEC budget execution dashboard — FY2026 execution, FY2027 congressional action, FY2028 formulation. Built from actual CBJ data.',
}

// Revalidate page every 4 hours to pick up fresh news from GitHub Actions cron
export const revalidate = 14400

export default function SecCFOPage() {
  return <SECFinancialPortal />
}
