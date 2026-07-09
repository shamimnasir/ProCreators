'use client'
import { TextGeneratorTemplate } from '@/components/shared/TextGeneratorTemplate'
import { Wand2 } from 'lucide-react'

export default function AIPromptPackPage() {
  return (
    <TextGeneratorTemplate
      config={{
        toolId: 'ai-prompt-pack',
        name: 'AI Prompt Pack Generator',
        icon: Wand2,
        tagline: 'Sellable prompt packs for Etsy & Gumroad. 25-200 prompts organized by category with copy-paste ready formatting.',
        apiPath: '/api/ai-prompt-pack/generate',
        bgGradient: 'from-fuchsia-500 to-purple-600',
        cta: 'Generate Prompt Pack (8 credits)',
        exampleOutput: 'A complete pack with 25-200 prompts organized into sub-categories, each with:\n\u2022 Use case description\n\u2022 Ready-to-copy prompt (with placeholders)\n\u2022 Example output preview\n\u2022 Formatted as Markdown for PDF/Notion export',
        fields: [
          { id: 'niche', label: 'Target niche', required: true, placeholder: 'e.g. Real estate agents, YouTubers, SaaS founders, marketers', hint: 'The buyer / user of this pack' },
          { id: 'category', label: 'Prompt category', type: 'select', options: [
            { value: 'marketing', label: 'Marketing & Growth' },
            { value: 'writing', label: 'Writing & Content' },
            { value: 'sales', label: 'Sales & Outreach' },
            { value: 'customer support', label: 'Customer Support' },
            { value: 'productivity', label: 'Productivity & Focus' },
            { value: 'business strategy', label: 'Business Strategy' },
            { value: 'social media', label: 'Social Media' },
            { value: 'coding', label: 'Coding & Development' },
            { value: 'design', label: 'Design & Branding' },
            { value: 'education', label: 'Education & Teaching' },
          ]},
          { id: 'packSize', label: 'Pack size', type: 'select', options: [
            { value: '25', label: '25 prompts \u2014 quick pack ($9\u2013$19)' },
            { value: '50', label: '50 prompts \u2014 standard pack ($19\u2013$29)' },
            { value: '100', label: '100 prompts \u2014 mega pack ($29\u2013$49)' },
            { value: '200', label: '200 prompts \u2014 ultimate pack ($49\u2013$99)' },
          ]},
          { id: 'aiTool', label: 'Which AI tools should the prompts work in?', type: 'select', options: [
            { value: 'ChatGPT, Claude, Gemini', label: 'All major LLMs (ChatGPT, Claude, Gemini)' },
            { value: 'ChatGPT', label: 'ChatGPT only (GPT-4o / o1)' },
            { value: 'Claude', label: 'Claude only (Sonnet / Opus)' },
            { value: 'Midjourney', label: 'Midjourney (image prompts)' },
          ]},
          { id: 'audience', label: 'Buyer profile', placeholder: 'e.g. freelancers, side-hustlers, agencies', hint: 'Helps the AI match tone and examples to the buyer', default: 'professionals' },
        ],
      }}
    />
  )
}
