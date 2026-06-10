import { redirect } from 'next/navigation'

// Root lands on the AnyFed portal (legacy SEC portal remains at /sec-cfo)
export default function RootPage() {
  redirect('/anyfed')
}
