'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Theme is permanently forced to light in layout.js
import { HomepageSchema } from '@/components/SchemaMarkup'

// Import modular landing page components
import {
  Header,
  HeroSection,
  ComparisonSection,
  FeaturesSection,
  StatsSection,
  UseCasesSection,
  ToolsShowcase,
  PhilosophySection,
  TestimonialsSection,
  PricingSection,
  CTASection,
  PopularToolsSection,
  Footer,
  homepageFAQs,
  testimonials,
  pricingTiers
} from '@/components/landing'

export default function HomeClient() {
  const router = useRouter()
  // Theme is permanently forced to light mode in layout.js
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const sessionToken = localStorage.getItem('sessionToken')
      if (sessionToken) {
        try {
          const res = await fetch('/api/auth/session', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
          })
          const data = await res.json()
          if (data.success && data.user) {
            setIsLoggedIn(true)
            setUserName(data.user.name || data.user.email?.split('@')[0] || 'User')
          }
        } catch (error) {
          // Silent fail for auth check
        }
      }
    }
    checkAuth()
  }, [])

  // Navigation handlers
  const handleGetStarted = () => router.push('/register')
  const handleExplore = () => router.push('/dashboard')
  const handleSelectPlan = (planName) => {
    router.push(planName === 'Free' ? '/register' : '/pricing')
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Schema.org structured data for SEO */}
      <HomepageSchema faqs={homepageFAQs} />
      
      {/* Header */}
      <Header 
        isLoggedIn={isLoggedIn}
        userName={userName}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Hero Section */}
      <HeroSection 
        onGetStarted={handleGetStarted}
        onExplore={handleExplore}
      />

      {/* Pricing Comparison - Right below hero for maximum impact */}
      <ComparisonSection onGetStarted={handleGetStarted} />

      {/* Features Section */}
      <FeaturesSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Use Cases Section */}
      <UseCasesSection />

      {/* Tools Showcase */}
      <ToolsShowcase />

      {/* Philosophy Section */}
      <PhilosophySection />

      {/* Testimonials Section */}
      <TestimonialsSection testimonials={testimonials} />

      {/* Pricing Section */}
      <PricingSection 
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
        pricingTiers={pricingTiers}
        onSelectPlan={handleSelectPlan}
      />

      {/* CTA Section */}
      <CTASection onGetStarted={handleGetStarted} />

      {/* Popular Tools Section */}
      <PopularToolsSection />

      {/* Footer */}
      <Footer />
    </div>
  )
}
