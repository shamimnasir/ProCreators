// Forgot Password Page - Server Component with Dynamic Metadata
import { getPageSeo } from '@/lib/get-page-seo'
import ForgotPasswordClient from './ForgotPasswordClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('forgot-password')
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
  }
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
