import { getPageSeo } from '@/lib/get-page-seo'
import CareersClient from './CareersClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('careers')
  const title = seo.title || 'Careers | ProCreators'
  return {
    title: { absolute: title },
    description: seo.description || 'Join the ProCreators team. Build the future of AI-powered content creation.',
    keywords: seo.keywords || 'careers, jobs, hiring, ProCreators',
  }
}

export default function CareersPage() {
  return <CareersClient />
}
