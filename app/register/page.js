// Register Page - Server Component with Dynamic Metadata
import { getPageSeo } from '@/lib/get-page-seo'
import RegisterClient from './RegisterClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('register')
  const title = seo.title || 'Sign Up | ProCreators'
  return {
    title: { absolute: title },
    description: seo.description || 'Create your free ProCreators account and start creating amazing content with AI.',
    keywords: seo.keywords || 'sign up, register, create account, ProCreators',
  }
}

export default function RegisterPage() {
  return <RegisterClient />
}
