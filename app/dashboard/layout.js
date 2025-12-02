'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e27]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0a0e27] to-[#1a1147] p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
