'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/Logo'

const steps = [
  {
    title: 'Welcome to ProCreators!',
    description: 'The ultimate AI-powered content creation platform',
    content: 'Create viral content, stunning images, engaging videos, and digital products with the power of AI.'
  },
  {
    title: 'Explore Your Tools',
    description: '20+ AI tools at your fingertips',
    content: 'From thread generators to video creators, we have everything you need to succeed as a content creator.'
  },
  {
    title: 'Start Creating',
    description: 'Your first content is just a click away',
    content: 'Ready to create income-friendly content that converts? Let\'s get started!'
  },
]

export default function OnboardingClient() {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push('/dashboard')
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo variant="icon" className="h-20 w-20" />
          </div>
          <CardTitle className="text-3xl text-white">{steps[currentStep].title}</CardTitle>
          <CardDescription className="text-lg">
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-8"
          >
            <p className="text-lg text-muted-foreground">
              {steps[currentStep].content}
            </p>
          </motion.div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-16 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={handleSkip}>
              Skip
            </Button>
            <Button className="flex-1" onClick={handleNext}>
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Get Started
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
