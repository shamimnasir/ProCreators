'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'

export default function DashboardLayout({ children }) {
  // Dashboard uses the default theme from ThemeProvider (light)
  // Users can toggle dark mode using the TopBar button
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
