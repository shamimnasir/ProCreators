'use client'
import { TextGeneratorTemplate } from '@/components/shared/TextGeneratorTemplate'
import { Heart } from 'lucide-react'

export default function WeddingSuitePage() {
  return (
    <TextGeneratorTemplate
      config={{
        toolId: 'wedding-suite',
        name: 'Wedding Printable Suite',
        icon: Heart,
        tagline: 'Complete 8-piece wedding stationery suite. $25\u2013$65 per Etsy sale, 95% margins.',
        apiPath: '/api/wedding-suite/generate',
        bgGradient: 'from-pink-500 to-rose-500',
        cta: 'Generate Suite (12 credits)',
        exampleOutput: 'Complete 8-piece stationery suite:\n1. Save-the-Date\n2. Formal Invitation\n3. RSVP Card\n4. Details Card\n5. Ceremony Program\n6. Reception Menu\n7. Table Numbers + Seating\n8. Thank You Card\n\nPlus a brand kit: colors, fonts, motifs.',
        fields: [
          { id: 'couple', label: 'Couple names', required: true, placeholder: 'e.g. Emma & Michael', hint: 'The names as they should appear on stationery' },
          { id: 'weddingDate', label: 'Wedding date', required: true, placeholder: 'e.g. Saturday, June 15, 2026' },
          { id: 'venue', label: 'Venue name & city', required: true, placeholder: 'e.g. Riverside Estate, Napa Valley' },
          { id: 'time', label: 'Ceremony time & reception detail', placeholder: 'e.g. 4:00 PM ceremony, reception to follow', default: '4:00 PM ceremony, reception to follow' },
          { id: 'dressCode', label: 'Dress code', type: 'select', options: [
            { value: 'Cocktail attire', label: 'Cocktail attire' },
            { value: 'Black tie', label: 'Black tie' },
            { value: 'Black tie optional', label: 'Black tie optional' },
            { value: 'Semi-formal', label: 'Semi-formal' },
            { value: 'Beach formal', label: 'Beach formal' },
            { value: 'Garden party casual', label: 'Garden party casual' },
          ]},
          { id: 'rsvpBy', label: 'RSVP deadline', placeholder: 'e.g. May 1, 2026' },
          { id: 'style', label: 'Aesthetic style', type: 'select', options: [
            { value: 'Rustic', label: 'Rustic (wood, greenery, kraft)' },
            { value: 'Minimalist', label: 'Minimalist (whitespace, thin lines)' },
            { value: 'Boho', label: 'Boho (pampas, terracotta, mixed fonts)' },
            { value: 'Elegant / classic', label: 'Elegant / classic (script + serif)' },
            { value: 'Modern romantic', label: 'Modern romantic (pastels, arches)' },
            { value: 'Vintage', label: 'Vintage (florals, dusty tones)' },
            { value: 'Tropical / destination', label: 'Tropical / destination' },
            { value: 'Winter / holiday', label: 'Winter / holiday' },
          ]},
        ],
      }}
    />
  )
}
