'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Image, Sparkles } from 'lucide-react'

// Cover image style presets
const COVER_STYLES = [
  { id: 'abstract', name: 'Abstract Art', description: 'Modern abstract patterns' },
  { id: 'minimalist', name: 'Minimalist', description: 'Clean, simple design' },
  { id: 'nature', name: 'Nature', description: 'Natural landscapes and elements' },
  { id: 'geometric', name: 'Geometric', description: 'Bold geometric shapes' },
  { id: 'watercolor', name: 'Watercolor', description: 'Soft watercolor effects' },
  { id: 'gradient', name: 'Gradient Only', description: 'No image, just colors' },
  { id: 'custom', name: 'Custom Prompt', description: 'Describe your own image' },
]

// ===== COVER IMAGE PROMPT COMPONENT =====
// Reusable cover image customization for all PDF tools
export default function CoverImagePrompt({
  coverImageStyle,
  setCoverImageStyle,
  customImagePrompt,
  setCustomImagePrompt,
  showTitle = true,
}) {
  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Cover Image</h3>
        </div>
      )}
      
      <div className="space-y-3">
        <Label>Image Style</Label>
        <Select value={coverImageStyle} onValueChange={setCoverImageStyle}>
          <SelectTrigger>
            <SelectValue placeholder="Select cover image style" />
          </SelectTrigger>
          <SelectContent>
            {COVER_STYLES.map((style) => (
              <SelectItem key={style.id} value={style.id}>
                <div className="flex flex-col">
                  <span>{style.name}</span>
                  <span className="text-xs text-muted-foreground">{style.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {coverImageStyle === 'custom' && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Describe Your Cover Image
          </Label>
          <Textarea
            value={customImagePrompt}
            onChange={(e) => setCustomImagePrompt(e.target.value)}
            placeholder="E.g., A serene mountain landscape at sunset with warm orange and purple colors, professional book cover style..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            AI will generate a unique cover image based on your description
          </p>
        </div>
      )}
      
      {coverImageStyle !== 'gradient' && coverImageStyle !== 'custom' && (
        <p className="text-xs text-muted-foreground">
          AI will generate a {COVER_STYLES.find(s => s.id === coverImageStyle)?.name.toLowerCase()} style cover image
        </p>
      )}
    </div>
  )
}
