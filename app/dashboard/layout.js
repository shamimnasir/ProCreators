'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export default function DashboardLayout({ children }) {
  const { setTheme } = useTheme()
  
  // Force light mode for dashboard - users can still toggle to dark mode using TopBar button
  useEffect(() => {
    setTheme('light')
  }, [setTheme])
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - hidden on mobile, shown on md+ */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
