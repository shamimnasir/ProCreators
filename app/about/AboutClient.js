'use client'

import { PublicLayout } from '@/components/shared/PublicLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Users,
  Target,
  Lightbulb,
  Heart,
  Globe,
  Server,
  Award,
  Shield,
  Cpu,
  TrendingUp
} from 'lucide-react'

export default function AboutClient() {
  const values = [
    { icon: Lightbulb, title: 'Innovation First', desc: 'We leverage cutting-edge AI to democratize content creation' },
    { icon: Users, title: 'Creator-Centric', desc: 'Every feature is built with creators in mind' },
    { icon: Heart, title: 'Quality Matters', desc: 'We never compromise on output quality' },
    { icon: Globe, title: 'Global Reach', desc: 'Supporting creators worldwide in multiple languages' },
  ]

  const stats = [
    { value: '60+', label: 'AI Tools' },
    { value: '100K+', label: 'Users' },
    { value: '10M+', label: 'Content Created' },
    { value: '10+', label: 'Languages' },
  ]

  const team = [
    { name: 'AI Technology', desc: 'Powered by Kling 3.0, Seedance 2.0, Gemini, and GPT-4', icon: Cpu },
    { name: 'Cloud Infrastructure', desc: 'Enterprise-grade servers ensuring 99.9% uptime', icon: Server },
    { name: 'Security', desc: 'Bank-level encryption and data protection', icon: Shield },
  ]

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-2 glass-badge text-purple-700 text-sm font-medium mb-4">
              About ProCreators
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-purple-700 to-purple-500 bg-clip-text text-transparent">
              Empowering Creators with AI
            </h1>
            <p className="text-xl text-muted-foreground">
              We're on a mission to democratize content creation. Our AI-powered platform helps creators, businesses, and educators produce professional content in minutes, not hours.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="glass-card-elevated p-8 md:p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-4">
                ProCreators was born from a simple observation: creating professional content shouldn't require expensive software, extensive training, or hours of work.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                We believe everyone has stories to tell, ideas to share, and businesses to grow. Our AI tools remove the technical barriers, letting you focus on what matters most—your creativity and message.
              </p>
              <p className="text-lg text-muted-foreground">
                From viral TikTok videos to professional business plans, from stunning carousels to complete ebooks—if you can imagine it, ProCreators can help you create it.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {values.map((value, i) => {
                const Icon = value.icon
                return (
                  <Card key={i} className="glass-card p-6 hover:bg-white/80 transition-all">
                    <Icon className="h-8 w-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold mb-1 text-foreground">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.desc}</p>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center text-foreground">Built on Cutting-Edge Technology</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((item, i) => (
              <Card key={i} className="glass-card p-6 text-center hover:bg-white/80 transition-all">
                <item.icon className="h-10 w-10 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-foreground">{item.name}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <Card className="glass-card-elevated p-12 text-center">
            <Award className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4 text-foreground">Join 100,000+ Creators</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Start creating professional content today. No credit card required.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl shadow-lg glow-orange">
                Start Free Trial
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    </PublicLayout>
  )
}
