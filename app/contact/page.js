import { getPageSeo } from '@/lib/get-page-seo'
import ContactClient from './ContactClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('contact')
  const title = seo.title || 'Contact Us | ProCreators'
  return {
    title: { absolute: title },
    description: seo.description || 'Get in touch with ProCreators. We\'re here to help with any questions or feedback.',
    keywords: seo.keywords || 'contact, support, help, ProCreators',
  }
}

export default function ContactPage() {
  return <ContactClient />
}
