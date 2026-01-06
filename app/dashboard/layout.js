'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'
import { useTheme } from 'next-themes'
import { useEffect, useRef } from 'react'

export default function DashboardLayout({ children }) {
  const { setTheme, theme } = useTheme()
  const initialLoadRef = useRef(true)
  
  // Force light mode only on initial dashboard load, then allow user to toggle
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      // Only set to light if coming from outside dashboard (e.g., from dark homepage)
      const storedTheme = localStorage.getItem('pubtools-dashboard-theme')
      if (!storedTheme) {
        setTheme('light')
      } else {
        setTheme(storedTheme)
      }
    }
  }, [setTheme])
  
  // Save user's theme preference for dashboard
  useEffect(() => {
    if (!initialLoadRef.current && theme) {
      localStorage.setItem('pubtools-dashboard-theme', theme)
    }
  }, [theme])
  
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
