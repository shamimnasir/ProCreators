'use client'

import { Header } from './Header'
import { Footer } from './Footer'

export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      <Header />
      <div className="pt-20">
        {children}
      </div>
      <Footer />
    </div>
  )
}
