'use client'

import { Card } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'

export default function TutorialsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tutorial Maker</h1>
        <p className="text-muted-foreground mt-1">Create educational tutorials</p>
      </div>
      <Card className="p-12 text-center">
        <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-semibold mb-2">Tutorial Maker Tool</p>
        <p className="text-sm text-muted-foreground">Tool page template ready for implementation</p>
      </Card>
    </div>
  )
}
