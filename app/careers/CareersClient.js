'use client'

import { PublicLayout } from '@/components/shared/PublicLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Briefcase,
  MapPin,
  Clock,
  Heart,
  Play,
  Globe,
  Coffee
} from 'lucide-react'

export default function CareersClient() {
  const perks = [
    { icon: Globe, title: 'Remote-First', desc: 'Work from anywhere in the world' },
    { icon: Clock, title: 'Flexible Hours', desc: 'Set your own schedule' },
    { icon: Play, title: 'Latest Tech', desc: 'Work with cutting-edge AI' },
    { icon: Heart, title: 'Health Benefits', desc: 'Comprehensive coverage' },
    { icon: Coffee, title: 'Learning Budget', desc: 'Grow your skills' },
  ]

  const openings = [
    { title: 'Senior AI Engineer', type: 'Full-time', location: 'Remote', dept: 'Engineering' },
    { title: 'Product Designer', type: 'Full-time', location: 'Remote', dept: 'Design' },
    { title: 'Technical Writer', type: 'Contract', location: 'Remote', dept: 'Content' },
    { title: 'Customer Success Manager', type: 'Full-time', location: 'Remote', dept: 'Support' },
  ]

  return (
    <PublicLayout>
      <section className="relative">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-2 glass-badge text-blue-700 text-sm font-medium mb-4">
              <Briefcase className="inline h-4 w-4 mr-1" /> Join Our Team
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-blue-700 to-blue-500 bg-clip-text text-transparent">
              Build the Future of Content Creation
            </h1>
            <p className="text-xl text-muted-foreground">
              Join a passionate team working on AI that empowers millions of creators worldwide.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Why Work With Us</h2>
          <div className="glass-card-elevated p-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {perks.map((perk, i) => {
                const Icon = perk.icon
                return (
                  <div key={i} className="text-center">
                    <Icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-foreground">{perk.title}</h3>
                    <p className="text-sm text-muted-foreground">{perk.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Open Positions</h2>
          <div className="space-y-4">
            {openings.map((job, i) => (
              <Card key={i} className="glass-card p-6 hover:bg-white/80 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.dept}</span>
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {job.type}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                    </div>
                  </div>
                  <Link href="/contact">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-md">Apply Now</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <Card className="glass-card-elevated p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Don't See a Perfect Fit?</h2>
            <p className="text-muted-foreground mb-6">We're always looking for talented people. Send us your resume!</p>
            <Link href="/contact">
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-lg">Get in Touch</Button>
            </Link>
          </Card>
        </div>
      </section>
    </PublicLayout>
  )
}
