import { Metadata } from 'next'
import AnyFedPortal from '@/components/anyfed/AnyFedPortal'

export const metadata: Metadata = {
  title: 'ANY FED | Federal Financial Management Portal',
  description:
    'Any-agency federal FM showcase — budget formulation/enactment/execution, accounting, audit, finance operations, internal controls, acquisition, and a live AI/ML workbench. Folder source data with USAspending live fallback.',
}

export const revalidate = 14400

export default function AnyFedPage() {
  return <AnyFedPortal />
}
