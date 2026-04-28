// Onboarding Page - Server Component with Dynamic Metadata
import { getPageSeo } from '@/lib/get-page-seo'
import OnboardingClient from './OnboardingClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('onboarding')
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
  }
}

export default function OnboardingPage() {
  return <OnboardingClient />
}
