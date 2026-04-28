// Reset Password Page - Server Component with Dynamic Metadata
import { getPageSeo } from '@/lib/get-page-seo'
import ResetPasswordClient from './ResetPasswordClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('reset-password')
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
  }
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
