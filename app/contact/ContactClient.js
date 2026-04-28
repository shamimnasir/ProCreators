'use client'

import { useState } from 'react'
import { PublicLayout } from '@/components/shared/PublicLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  Send,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ContactClient() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setSubmitted(true)
        toast({ title: 'Message sent!', description: 'We\'ll get back to you within 24 hours.' })
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        toast({ 
          title: 'Error', 
          description: data.error || 'Failed to send message. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Contact form error:', error)
      toast({ 
        title: 'Error', 
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const contacts = [
    { icon: Mail, title: 'Email Us', value: 'support@procreators.io', desc: 'For general inquiries' },
    { icon: Clock, title: 'Response Time', value: 'Within 24 hours', desc: 'Usually faster!' },
    { icon: MapPin, title: 'Location', value: 'Remote-First', desc: 'Serving creators globally' },
  ]

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 glass-badge bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-sm font-medium mb-4">
              <MessageSquare className="inline h-4 w-4 mr-1" />
              Get in Touch
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl text-muted-foreground">
              Have a question, feedback, or need help? We're here for you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {contacts.map((item, i) => {
              const Icon = item.icon
              return (
                <Card key={i} className="p-6 text-center">
                  <Icon className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-lg font-medium text-foreground">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            {submitted ? (
              <Card className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
                <p className="text-muted-foreground mb-6">
                  Thanks for reaching out. We'll get back to you within 24 hours.
                </p>
                <Button onClick={() => setSubmitted(false)} variant="outline">
                  Send Another Message
                </Button>
              </Card>
            ) : (
              <Card className="glass-card p-8">
                <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="How can we help?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Tell us more..."
                      rows={6}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Message'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Card>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
