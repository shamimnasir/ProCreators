'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

// Redirect old niche pages to the unified Video Studio
export default function NicheRedirectPage() {
  const router = useRouter()
  const params = useParams()
  
  useEffect(() => {
    // Redirect to Video Studio with the niche pre-selected via query param
    router.replace(`/dashboard/tools/ai-video-studio?mode=stock&theme=${params.niche || ''}`)
  }, [router, params])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to Video Studio...</p>
      </div>
    </div>
  )
}
