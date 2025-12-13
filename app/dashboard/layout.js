'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'

export default function DashboardLayout({ children }) {
  const { setTheme } = useTheme()
  
  // Force light mode on dashboard
  useEffect(() => {
    setTheme('light')
  }, [setTheme])
  
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
