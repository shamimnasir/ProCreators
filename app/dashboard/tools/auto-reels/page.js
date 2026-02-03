'use client'

import { Card } from '@/components/ui/card'
import { Zap } from 'lucide-react'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

export default function AutoReelsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auto Reels</h1>
          <p className="text-muted-foreground mt-1">Automated reel creation</p>
        </div>
        <CreditCostBadge toolId="auto-reels" />
      </div>
      <Card className="p-12 text-center">
        <Zap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-semibold mb-2">Auto Reels Tool</p>
        <p className="text-sm text-muted-foreground">Automation feature ready for implementation</p>
      </Card>
    </div>
  )
}
