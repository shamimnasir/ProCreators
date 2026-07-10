'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { homepageFAQs } from './data'
import { Logo } from '@/components/ui/Logo'

// ============================================================
// USE CASES, unused on new homepage (kept exported to avoid breakage)
// ============================================================
export function UseCasesSection() { return null }
export function PhilosophySection() { return null }
export function PopularToolsSection() { return null }

// ============================================================
// TOOL SHOWCASE, 6 core publishing tools with real capabilities
// ============================================================
const toolCards = [
 {
  name: 'Ebook Creator',
  href: '/tools/ebook-maker',
  badge: 'Most Used',
  desc: 'Full ebook, chapter by chapter, with title page, table of contents, introduction, and conclusion auto-built.',
  highlights: [
   '5 cover styles × 3 typography sets, mix and match',
   'AI-written chapters with key takeaways per chapter',
   'Auto-saved drafts so nothing is ever lost',
   'One-click 300 DPI KDP PDF export',
  ],
 },
 {
  name: 'KDP Cover Designer',
  href: '/tools/cover-image-creator',
  badge: 'Publisher Favourite',
  desc: 'Front, spine, and back in one flow. Auto-calculates spine width from your page count.',
  highlights: [
   '12+ platform presets: KDP paperback, Kindle, Etsy shop, YouTube, socials',
   'Point-perfect dimensions for every marketplace (no rejections)',
   '300 DPI print export, ready to upload straight to KDP',
  ],
 },
 {
  name: 'Interior Page Builder',
  href: '/tools/planner-maker',
  badge: null,
  desc: 'Journals, planners, habit trackers, and activity pages in KDP interior sizes.',
  highlights: [
   '10 planner types: daily, weekly, monthly, habit, budget, meal, fitness, goal, project, gratitude',
   '5 color themes × 4 design styles for on-brand output',
   'Auto-formatted for 6×9, 8.5×11, A4, and A5. No Canva required.',
  ],
 },
 {
  name: 'Amazon Listing Writer',
  href: '/tools/amazon-listing',
  badge: 'Saves 3 Hours',
  desc: 'Title, 7 bullet points, description, and backend keywords, all Amazon algorithm optimized.',
  highlights: [
   'One-click SEO meta description',
   'Built-in AI Humanizer so your listing passes AI detection',
   'Copy-paste ready for KDP and Etsy dashboards',
  ],
 },
 {
  name: 'Coloring Book Generator',
  href: '/tools/coloring-book',
  badge: null,
  desc: 'AI line-art in KDP-accepted sizes. 10 to 120 pages per book.',
  highlights: [
   '5 KDP paper sizes: 8.5×11 (gold standard), 8×10, 8.5×8.5 (mandalas), 7×10, 8.25×8.25',
   'Print-ready 300 DPI with correct bleed and margins',
   'Works for both Amazon KDP and Etsy printables',
  ],
 },
 {
  name: 'Journal Maker',
  href: '/tools/journal-maker',
  badge: null,
  desc: '8 journal types with unique prompts per page. Gratitude, mindfulness, dream, travel, bullet, reading, fitness.',
  highlights: [
   'KDP interior trims: 6×9 (most popular) and 5.5×8.5',
   '4 design themes: Floral, Elegant, Minimalist, Boho',
   'Prompted pages so buyers get real value, not blank pages',
  ],
 },
]

export function ToolsShowcase() {
 return (
  <section aria-label="Core AI publishing tools in ProCreators" className="py-20 md:py-28">
   <div className="container px-6">
    <div className="mx-auto max-w-3xl text-center mb-14 space-y-3">
     <h2 className="text-3xl md:text-5xl font-bold tracking-tight">The Complete Publishing Stack. Nothing Extra.</h2>
     <p className="text-lg text-muted-foreground">Every feature below is built into ProCreators. No add-ons. No Canva. No Fiverr designers.</p>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
     {toolCards.map((t, i) => (
      <motion.div
       key={i}
       initial={{ opacity: 0, y: 30 }}
       whileInView={{ opacity: 1, y: 0 }}
       viewport={{ once: true }}
       transition={{ duration: 0.5, delay: i * 0.06 }}
      >
       <Link href={t.href} className="block h-full">
        <article className="glass-card-elevated rounded-2xl p-6 space-y-3 h-full hover:scale-[1.02] transition-transform relative">
         {t.badge && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">{t.badge}</div>
         )}
         <h3 className="text-lg font-bold text-foreground pr-16">{t.name}</h3>
         <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
         <ul className="space-y-1.5 pt-1">
          {t.highlights.map((h, j) => (
           <li key={j} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-1.5">
            <span className="text-orange-500 flex-shrink-0 mt-0.5">✓</span>
            <span>{h}</span>
           </li>
          ))}
         </ul>
         <div className="text-sm font-semibold text-orange-600 inline-flex items-center gap-1 pt-2">Open tool <ArrowRight className="w-3.5 h-3.5" /></div>
        </article>
       </Link>
      </motion.div>
     ))}
    </div>
    <div className="flex justify-center mt-10">
     <Link href="/tools" className="text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1 underline-offset-4 hover:underline">
      + See the complete publishing toolkit <ArrowRight className="w-4 h-4" />
     </Link>
    </div>
   </div>
  </section>
 )
}

// ============================================================
// BEFORE / AFTER COMPARISON TABLE + FAQ + FOOTER
// ============================================================
const comparisonRows = [
 { task: 'Niche research', without: '2–4 hours on Google/YouTube', with: '5 minutes' },
 { task: 'Writing content', without: '3–7 days per book', with: 'Under 15 minutes' },
 { task: 'Cover design', without: '$30–$100 Fiverr or 4+ hrs Canva', with: '5 minutes, KDP-ready' },
 { task: 'Interior pages', without: 'Manual Canva formatting', with: 'Auto-generated' },
 { task: 'Amazon listing', without: 'Keyword guessing, 5 rewrites', with: 'One click, SEO-optimised' },
 { task: 'Total per product', without: '10–20 hours', with: 'Under 30 minutes', bold: true },
 { task: 'Tools needed', without: '5–7 separate subscriptions', with: 'ProCreators only' },
]

export function ComparisonTable({ onGetStarted }) {
 return (
 <section aria-label="Publishing workflow comparison: before and after ProCreators" className="py-20 md:py-28">
 <div className="container px-6">
 <div className="mx-auto max-w-3xl text-center mb-12 space-y-3">
 <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Your Publishing Workflow: Before vs. After</h2>
 </div>
 <div className="mx-auto max-w-5xl glass-card-elevated rounded-3xl p-4 md:p-6 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm md:text-base">
 <thead>
 <tr className="border-b-2 border-white/40">
 <th className="text-left p-3 md:p-4 font-semibold text-muted-foreground">Task</th>
 <th className="text-left p-3 md:p-4 font-semibold text-slate-600">Without ProCreators</th>
 <th className="text-left p-3 md:p-4 font-bold text-orange-600">With ProCreators</th>
 </tr>
 </thead>
 <tbody>
 {comparisonRows.map((r, i) => (
 <tr key={i} className={`border-b border-white/30 ${r.bold ? 'font-bold' : ''}`}>
 <td className="p-3 md:p-4 text-foreground">{r.task}</td>
 <td className="p-3 md:p-4 text-muted-foreground">{r.without}</td>
 <td className="p-3 md:p-4 text-foreground">{r.with}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 <div className="flex justify-center mt-10">
 <Button size="lg" onClick={onGetStarted} aria-label="Start publishing faster, first product free" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xl glow-orange rounded-2xl">
 Start Publishing Faster. First Product Free
 <ArrowRight className="ml-2 h-5 w-5" />
 </Button>
 </div>
 </div>
 </section>
 )
}

export function FAQSection() {
 const [openIdx, setOpenIdx] = useState(0)
 return (
 <section aria-label="Frequently asked questions about ProCreators" className="py-20 md:py-28">
 <div className="container px-6">
 <div className="mx-auto max-w-3xl text-center mb-12">
 <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Questions Publishers Ask Before Signing Up</h2>
 </div>
 <dl className="mx-auto max-w-3xl space-y-3">
 {homepageFAQs.map((f, i) => (
 <div key={i} className="glass-card-elevated rounded-2xl overflow-hidden">
 <dt>
 <button
 onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
 aria-expanded={openIdx === i}
 className="w-full flex items-center justify-between text-left px-6 py-5"
 >
 <h3 className="text-base md:text-lg font-bold text-foreground pr-4">{f.q}</h3>
 <ChevronDown className={`w-5 h-5 text-orange-500 flex-shrink-0 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
 </button>
 </dt>
 {openIdx === i && (
 <dd className="px-6 pb-6 -mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">{f.a}</dd>
 )}
 </div>
 ))}
 </dl>
 </div>
 </section>
 )
}

// ============================================================
// FOOTER
// ============================================================
export function Footer() {
 return (
 <footer className="border-t border-white/30 bg-white/50 backdrop-blur-2xl mt-10">
 <div className="container px-6 py-14">
 <div className="grid md:grid-cols-4 gap-10">
 <div className="space-y-3 md:col-span-1">
 <Logo variant="full" className="h-10 w-10" />
 <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">The AI publishing studio for Amazon KDP and Etsy sellers. Publish faster. Earn more royalties.</p>
 </div>

 <div className="space-y-3">
 <h4 className="font-bold text-foreground">Solutions</h4>
 <ul className="space-y-2 text-sm">
 <li><Link href="/for-kdp-publishers" className="text-muted-foreground hover:text-foreground transition-colors">KDP Publishers</Link></li>
 <li><Link href="/for-etsy-sellers" className="text-muted-foreground hover:text-foreground transition-colors">Etsy Printable Sellers</Link></li>
 <li><Link href="/tools?category=digital-products" className="text-muted-foreground hover:text-foreground transition-colors">Low-Content Book Creators</Link></li>
 <li><Link href="/tools/journal-maker" className="text-muted-foreground hover:text-foreground transition-colors">Journal & Planner Sellers</Link></li>
 <li><Link href="/tools/coloring-book" className="text-muted-foreground hover:text-foreground transition-colors">Coloring Book Creators</Link></li>
 </ul>
 </div>

 <div className="space-y-3">
 <h4 className="font-bold text-foreground">Product</h4>
 <ul className="space-y-2 text-sm">
 <li><Link href="/tools" className="text-muted-foreground hover:text-foreground transition-colors">Tools</Link></li>
 <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
 <li><Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
 <li><Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
 </ul>
 </div>

 <div className="space-y-3">
 <h4 className="font-bold text-foreground">Resources</h4>
 <ul className="space-y-2 text-sm">
 <li><Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Free KDP Niche Guide</Link></li>
 <li><Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">How to Publish Your First Ebook</Link></li>
 <li><Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Amazon KDP Requirements Guide</Link></li>
 <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact / Support</Link></li>
 </ul>
 </div>
 </div>
 <div className="pt-10 mt-10 border-t border-white/30 flex flex-col md:flex-row items-center justify-between gap-3">
 <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} ProCreators. All rights reserved.</p>
 <div className="flex items-center gap-6 text-sm text-muted-foreground">
 <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
 <Link href="/terms" className="hover:text-foreground">Terms</Link>
 </div>
 </div>
 </div>
 </footer>
 )
}
