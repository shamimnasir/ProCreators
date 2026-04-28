import { getPageSeo } from '@/lib/get-page-seo'
import FAQClient from './FAQClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('faq')
  const title = seo.title || 'FAQ | ProCreators'
  return {
    title: { absolute: title },
    description: seo.description || 'Find answers to frequently asked questions about ProCreators AI content creation tools.',
    keywords: seo.keywords || 'FAQ, questions, help, support, ProCreators',
  }
}

export default function FAQPage() {
  return <FAQClient />
}
