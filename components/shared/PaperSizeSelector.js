'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  EBOOK_SIZES, 
  PLANNER_SIZES, 
  COLORING_BOOK_SIZES, 
  WORKBOOK_SIZES, 
  CHECKLIST_SIZES,
  RECIPE_BOOK_SIZES,
  ALL_SIZES,
  formatSizeOptions 
} from '@/lib/paper-sizes'

// Size presets by tool type
const SIZE_PRESETS = {
  ebook: EBOOK_SIZES,
  planner: PLANNER_SIZES,
  journal: PLANNER_SIZES,
  coloring: COLORING_BOOK_SIZES,
  workbook: WORKBOOK_SIZES,
  worksheet: WORKBOOK_SIZES,
  checklist: CHECKLIST_SIZES,
  recipe: RECIPE_BOOK_SIZES,
  all: ALL_SIZES,
}

export default function PaperSizeSelector({ 
  value, 
  onChange, 
  toolType = 'all',
  label = 'Paper Size',
  showDescription = true,
}) {
  const sizes = SIZE_PRESETS[toolType] || ALL_SIZES
  const grouped = formatSizeOptions(sizes)
  
  // Find current size for display
  const currentSize = sizes.find(s => s.id === value)
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select paper size">
            {currentSize ? (
              <span className="flex items-center gap-2">
                <span>{currentSize.name}</span>
                {showDescription && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    ({currentSize.description})
                  </span>
                )}
              </span>
            ) : (
              'Select size'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(grouped).map(([category, categorySizes]) => (
            <SelectGroup key={category}>
              <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {category}
              </SelectLabel>
              {categorySizes.map((size) => (
                <SelectItem key={size.id} value={size.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{size.name}</span>
                    <span className="text-xs text-muted-foreground">{size.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {currentSize && showDescription && (
        <p className="text-xs text-muted-foreground">
          {currentSize.inches.width}" × {currentSize.inches.height}" — {currentSize.description}
        </p>
      )}
    </div>
  )
}
