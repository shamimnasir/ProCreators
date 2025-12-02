'use client'

import { Card } from '@/components/ui/card'
import { Presentation } from 'lucide-react'

export default function SlidesMakerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Slides Maker</h1>
        <p className="text-muted-foreground mt-1">Create professional presentations</p>
      </div>
      <Card className="p-12 text-center">
        <Presentation className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-semibold mb-2">Slides Maker Tool</p>
        <p className="text-sm text-muted-foreground">Tool page template ready for implementation</p>
      </Card>
    </div>
  )
}
