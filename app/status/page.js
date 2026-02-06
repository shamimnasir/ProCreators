import { StaticPage } from '@/components/StaticPage'

export const metadata = {
  title: 'System Status | ProCreators',
  description: 'Check the current status of ProCreators services. View uptime, incidents, and maintenance schedules.',
}

export default function StatusPage() {
  return <StaticPage pageId="status" />
}
