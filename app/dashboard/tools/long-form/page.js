'use client'

import { Card } from '@/components/ui/card'
import { Video } from 'lucide-react'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

export default function LongFormPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Long Form Video</h1>
          <p className="text-muted-foreground mt-1">Create long-form video content</p>
        </div>
        <CreditCostBadge toolId="long-form" />
      </div>
      <Card className="p-12 text-center">
        <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-semibold mb-2">Long Form Video Tool</p>
        <p className="text-sm text-muted-foreground">Tool page template ready for implementation</p>
      </Card>
    </div>
  )
}
