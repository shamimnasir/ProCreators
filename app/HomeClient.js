'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
 Header,
 HeroSection,
 FeaturesSection,
 ComparisonSection,
 StatsSection,
 ToolsShowcase,
 ComparisonTable,
 PricingSection,
 FAQSection,
 CTASection,
 Footer,
 homepageFAQs,
} from '@/components/landing'

// ============================================================
// JSON-LD blocks (FAQPage + SoftwareApplication for GEO/LLM discovery)
// ============================================================
const faqJsonLd = {
 '@context': 'https://schema.org',
 '@type': 'FAQPage',
 mainEntity: [
 {
 '@type': 'Question',
 name: 'What is ProCreators?',
 acceptedAnswer: {
 '@type': 'Answer',
 text: 'ProCreators is an AI publishing studio built specifically for Amazon KDP and Etsy sellers. It generates complete digital products, ebooks, journals, planners, coloring books, and activity books, including writing, cover design, interior pages, and Amazon listing copy, in under 30 minutes.',
 },
 },
 {
 '@type': 'Question',
 name: 'How long does it take to publish a book with ProCreators?',
 acceptedAnswer: {
 '@type': 'Answer',
 text: 'Most users complete a full product, writing, cover, interior pages, and Amazon listing, in under 30 minutes. The traditional process without ProCreators typically takes 10 to 20 hours per book.',
 },
 },
 {
 '@type': 'Question',
 name: 'Is ProCreators free to try?',
 acceptedAnswer: {
 '@type': 'Answer',
 text: 'Yes. Your first complete product, ebook, cover, interior pages, and listing copy, is completely free. No credit card required.',
 },
 },
 {
 '@type': 'Question',
 name: 'What types of products can I create with ProCreators?',
 acceptedAnswer: {
 '@type': 'Answer',
 text: 'ProCreators creates ebooks, journals, daily and weekly planners, coloring books, activity books for children, habit trackers, recipe books, and puzzle books. All exports are formatted for Amazon KDP and Etsy.',
 },
 },
 {
 '@type': 'Question',
 name: 'Do I own the products I create?',
 acceptedAnswer: {
 '@type': 'Answer',
 text: 'Yes. Everything you create with ProCreators is 100% yours. You own the content, the designs, and the published products. ProCreators has no claim on anything you create.',
 },
 },
 {
 '@type': 'Question',
 name: 'Is the export KDP-ready?',
 acceptedAnswer: {
 '@type': 'Answer',
 text: 'Yes. All exports are formatted to Amazon KDP specifications by default, correct margins, bleed settings, 300 DPI resolution, and automatic spine width calculation for print books.',
 },
 },
 ],
}

const softwareAppJsonLd = {
 '@context': 'https://schema.org',
 '@type': 'SoftwareApplication',
 name: 'ProCreators',
 applicationCategory: 'BusinessApplication',
 operatingSystem: 'Web',
 description: 'AI publishing studio for Amazon KDP and Etsy sellers. Generates complete digital products including ebooks, journals, planners, and coloring books in under 30 minutes.',
 offers: [
 { '@type': 'Offer', name: 'Free Trial', price: '0', priceCurrency: 'USD', description: 'One complete product free. No credit card required.' },
 { '@type': 'Offer', name: 'Publisher Plan', price: '29', priceCurrency: 'USD', billingIncrement: 'P1M', description: '10 complete products per month, unlimited covers, KDP export.' },
 { '@type': 'Offer', name: 'Pro Publisher Plan', price: '59', priceCurrency: 'USD', billingIncrement: 'P1M', description: '30 complete products per month, niche research tool, priority support.' },
 ],
 url: 'https://procreators.io',
}

export default function HomeClient() {
 const router = useRouter()
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
 const [isLoggedIn, setIsLoggedIn] = useState(false)
 const [userName, setUserName] = useState('')

 // Check if user is logged in
 useEffect(() => {
 const checkAuth = async () => {
 const sessionToken = localStorage.getItem('sessionToken')
 if (!sessionToken) return
 try {
 const res = await fetch('/api/auth/session', {
 headers: { Authorization: `Bearer ${sessionToken}` },
 })
 const data = await res.json()
 if (data.success && data.user) {
 setIsLoggedIn(true)
 setUserName(data.user.name || data.user.email?.split('@')[0] || 'User')
 }
 } catch (_) {}
 }
 checkAuth()
 }, [])

 const onGetStarted = () => router.push('/register')
 const onExplore = () => {
 if (typeof document !== 'undefined') {
 document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
 }
 }

 return (
 <div className="min-h-screen">
 {/* FAQ + SoftwareApplication JSON-LD for LLM / GEO discovery */}
 <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
 <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }} />

 <Header
 isLoggedIn={isLoggedIn}
 userName={userName}
 mobileMenuOpen={mobileMenuOpen}
 setMobileMenuOpen={setMobileMenuOpen}
 />

 <HeroSection onGetStarted={onGetStarted} onExplore={onExplore} />
 <FeaturesSection onGetStarted={onGetStarted} />
 <ComparisonSection onGetStarted={onGetStarted} />
 <StatsSection />
 <ToolsShowcase />
 <ComparisonTable onGetStarted={onGetStarted} />
 <PricingSection />
 <FAQSection />
 <CTASection onGetStarted={onGetStarted} />
 <Footer />
 </div>
 )
}
