'use client'
import { TextGeneratorTemplate } from '@/components/shared/TextGeneratorTemplate'
import { Grid3x3 } from 'lucide-react'

export default function SpreadsheetTemplatePage() {
  return (
    <TextGeneratorTemplate
      config={{
        toolId: 'spreadsheet-template',
        name: 'Spreadsheet Template Builder',
        icon: Grid3x3,
        tagline: 'Google Sheets / Excel templates with formulas, sample data, and setup guide. Sells for $15\u2013$50 on Gumroad and Etsy.',
        apiPath: '/api/spreadsheet-template/generate',
        bgGradient: 'from-green-500 to-emerald-600',
        cta: 'Generate Template (8 credits)',
        exampleOutput: 'A complete spreadsheet template with:\n\u2022 Sheet / tab structure\n\u2022 CSV-ready column headers + sample data\n\u2022 Key formulas explained\n\u2022 Dashboard / chart suggestions\n\u2022 Setup guide for the buyer\n\u2022 One-click CSV download',
        fields: [
          { id: 'templateType', label: 'Template type', required: true, placeholder: 'e.g. Personal Budget, Freelancer Invoice, Airbnb Host Dashboard, Sales Pipeline, Wedding Planner', hint: 'Be specific \u2014 niche templates sell 3x better than generic ones' },
          { id: 'audience', label: 'Buyer profile', required: true, placeholder: 'e.g. freelance designers, first-time home buyers, Amazon FBA sellers' },
          { id: 'style', label: 'Design style', type: 'select', options: [
            { value: 'Professional & minimal', label: 'Professional & minimal' },
            { value: 'Colorful & modern', label: 'Colorful & modern' },
            { value: 'Feminine / aesthetic', label: 'Feminine / aesthetic' },
            { value: 'Corporate / dashboard', label: 'Corporate / dashboard' },
            { value: 'Playful / notion-inspired', label: 'Playful / Notion-inspired' },
          ]},
        ],
      }}
    />
  )
}
