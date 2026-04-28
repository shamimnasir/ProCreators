'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to the unified Video Studio with Quick Mode active
export default function QuickReelsRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard/tools/ai-video-studio?mode=stock')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to Video Studio...</p>
      </div>
    </div>
  )
}
