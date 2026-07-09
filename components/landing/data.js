// Landing page shared data — KDP/Etsy publisher positioning
// (Legacy exports kept as empty arrays so nothing breaks in the transition.)

import { Clock, DollarSign, Layers } from 'lucide-react'

// New homepage FAQ set (also mirrored in FAQPage JSON-LD in HomeClient.js).
export const homepageFAQs = [
  {
    q: 'What exactly counts as one complete product?',
    a: "One product means one complete ebook, journal, planner, coloring book, or activity book — from blank page to download-ready file. That includes: all written content, the KDP cover (front, spine, back), all interior pages, and the Amazon listing copy. Everything. In one product count."
  },
  {
    q: 'Do I own everything I create with ProCreators?',
    a: "Yes. 100%. Every word, every design, every page. It's yours the moment you create it. Upload it to Amazon KDP, sell it on Etsy, bundle it, sell the rights — we have no claim on any of it."
  },
  {
    q: 'Is the output actually KDP-ready without reformatting?',
    a: 'Yes. Exports are built to Amazon KDP specifications from the start — correct margins, bleed settings, 300 DPI resolution, and automatic spine width calculation for print books. You download the file and upload it directly to KDP. No Canva adjustments, no format conversion, no reformatting.'
  },
  {
    q: 'What happens to my products if I cancel my plan?',
    a: "They're yours forever. Nothing is deleted, nothing is locked. Your exported files stay on your device. Your published Amazon and Etsy listings keep earning royalties. Cancelling ProCreators doesn't touch your published products in any way."
  },
]

// New pricing tiers — publisher positioning.
export const pricingTiers = [
  {
    name: 'Try It Free',
    price: '$0',
    price_sub: 'forever',
    description: 'One complete product, on us',
    highlighted: false,
    features: [
      '1 complete ebook, planner, or coloring book',
      '1 KDP cover design (front, spine, back)',
      '1 Amazon listing (title, bullets, keywords)',
      'KDP-formatted PDF export',
      'No credit card required',
    ],
    cta_text: 'Start Free — No Card Needed',
    cta_href: '/register',
    cta_aria: 'Start free with one complete product — no credit card required',
  },
  {
    name: 'Publisher',
    price: '$29',
    price_sub: '/month',
    badge: 'Most Popular',
    description: 'For publishers releasing 5–10 products per month',
    highlighted: true,
    features: [
      '10 complete products per month',
      'Unlimited cover designs',
      '100 interior pages per month',
      'Amazon listing writer (10 listings)',
      'KDP-ready export (PDF, EPUB)',
      'Email support',
    ],
    cta_text: 'Start Publishing — $29/mo',
    cta_href: '/register?plan=publisher',
    cta_aria: 'Start the Publisher plan at $29 per month',
  },
  {
    name: 'Pro Publisher',
    price: '$59',
    price_sub: '/month',
    description: 'For serious publishers releasing 20+ products monthly',
    highlighted: false,
    features: [
      '30 complete products per month',
      'Unlimited covers and interior pages',
      'Niche research tool included',
      'Unlimited Amazon listing optimisation',
      'Bulk export',
      'Priority support',
    ],
    cta_text: 'Go Pro — $59/mo',
    cta_href: '/register?plan=pro',
    cta_aria: 'Start the Pro Publisher plan at $59 per month',
  },
]

// Legacy exports — kept as empty/minimal to preserve any stale imports.
// Sections that used these have been rewritten to no longer depend on them.
export const tools = []
export const features = []
export const stats = []
export const useCases = []
export const testimonials = []
export const popularTools = []

// Pain-point cards used on the new homepage.
export const painPoints = [
  {
    icon: Clock,
    title: "Every hour you research is an hour you didn't publish",
    body: "You spend days finding the right niche, then more days writing — before you've even touched Canva for the cover. By the time your first book is done, your competitor published three."
  },
  {
    icon: DollarSign,
    title: 'Slow publishing = slow royalties. The math is brutal.',
    body: 'A planner that earns $4 per sale needs 250 sales to make $1,000. If it takes you 15 hours to build, you’d need to work 500+ hours to build a $10K/month catalogue. ProCreators cuts that to 50 hours.'
  },
  {
    icon: Layers,
    title: '5 tools open, zero system, constant copy-pasting',
    body: 'ChatGPT for writing. Canva for the cover. Publisher Rocket for keywords. Designrr for formatting. Word for editing. All that context-switching costs you hours every single book.'
  },
]
