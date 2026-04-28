import { getPageSeo } from '@/lib/get-page-seo'
import StatusClient from './StatusClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const seo = await getPageSeo('status')
  const title = seo.title || 'System Status | ProCreators'
  return {
    title: { absolute: title },
    description: seo.description || 'Check the current status of ProCreators services and AI tools.',
    keywords: seo.keywords || 'status, uptime, services, ProCreators',
  }
}

export default function StatusPage() {
  return <StatusClient />
}
