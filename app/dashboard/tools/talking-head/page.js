'use client'

import { Card } from '@/components/ui/card'
import { User } from 'lucide-react'
import { CreditCostBadge } from '@/components/CreditCostBadge'
import { useCredits } from '@/components/CreditBalance'

export default function TalkingHeadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Talking-Head Generator</h1>
        <p className="text-muted-foreground mt-1">Create AI-powered talking head videos</p>
      </div>
      <Card className="p-12 text-center">
        <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-semibold mb-2">Talking-Head Tool</p>
        <p className="text-sm text-muted-foreground">Tool page template ready for implementation</p>
      </Card>
    </div>
  )
}
