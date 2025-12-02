'use client'

import { Card } from '@/components/ui/card'
import { List } from 'lucide-react'

export default function ListsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">List Generator</h1>
        <p className="text-muted-foreground mt-1">Create engaging list-based content</p>
      </div>
      <Card className="p-12 text-center">
        <List className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-semibold mb-2">List Generator Tool</p>
        <p className="text-sm text-muted-foreground">Tool page template ready for implementation</p>
      </Card>
    </div>
  )
}
