import AnyFedPortal from '@/components/anyfed/AnyFedPortal'

export const revalidate = 14400

// Root URL is the ANY FED federal FM portal.
// The legacy SEC-only portal lives at /sec-cfo.
export default function RootPage() {
  return <AnyFedPortal />
}
