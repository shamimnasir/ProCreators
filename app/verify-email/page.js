// Verify Email Page - Server Component with Dynamic Metadata
import { getPageSeo } from '@/lib/get-page-seo'
import VerifyEmailClient from './VerifyEmailClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('verify-email')
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
  }
}

export default function VerifyEmailPage() {
  return <VerifyEmailClient />
}
