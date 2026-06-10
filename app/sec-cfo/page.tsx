import { redirect } from 'next/navigation'
// Legacy route — portal moved to root URL
export default function SecCFORedirect() { redirect('/') }
