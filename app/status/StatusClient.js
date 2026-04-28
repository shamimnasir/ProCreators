'use client'

import { useState, useEffect } from 'react'
import { PublicLayout } from '@/components/shared/PublicLayout'
import { Card } from '@/components/ui/card'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Server,
  Database,
  Play,
  Globe
} from 'lucide-react'

export default function StatusClient() {
  const [lastUpdate, setLastUpdate] = useState('')

  useEffect(() => {
    setLastUpdate(new Date().toLocaleString())
  }, [])

  const services = [
    { name: 'Web Application', status: 'operational', icon: Globe },
    { name: 'API Services', status: 'operational', icon: Server },
    { name: 'Database', status: 'operational', icon: Database },
    { name: 'AI Video Generation (Kling)', status: 'operational', icon: Play },
    { name: 'AI Video Generation (Seedance)', status: 'operational', icon: Play },
    { name: 'AI Image Generation', status: 'operational', icon: Play },
    { name: 'AI Text Generation', status: 'operational', icon: Play },
    { name: 'Payment Processing', status: 'operational', icon: Activity },
  ]

  const getStatusInfo = (status) => {
    switch (status) {
      case 'operational':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Operational' }
      case 'degraded':
        return { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Degraded' }
      case 'outage':
        return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Outage' }
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'Unknown' }
    }
  }

  const allOperational = services.every(s => s.status === 'operational')

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 text-sm font-medium mb-4">
              <Activity className="inline h-4 w-4 mr-1" />
              System Status
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Service Status</h1>
            
            {/* Overall Status */}
            <Card className={`p-6 ${allOperational ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
              <div className="flex items-center justify-center gap-3">
                {allOperational ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <span className="text-xl font-semibold text-green-500">All Systems Operational</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                    <span className="text-xl font-semibold text-yellow-500">Some Systems Experiencing Issues</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Last updated: {lastUpdate}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Status */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">Services</h2>
          <div className="space-y-3">
            {services.map((service, i) => {
              const statusInfo = getStatusInfo(service.status)
              const StatusIcon = statusInfo.icon
              const ServiceIcon = service.icon
              return (
                <Card key={i} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ServiceIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bg}`}>
                      <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                      <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Uptime */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">Uptime (Last 90 Days)</h2>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Overall Uptime</span>
              <span className="text-2xl font-bold text-green-500">99.95%</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 90 }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-8 rounded-sm ${i === 45 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  title={`Day ${90 - i}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>90 days ago</span>
              <span>Today</span>
            </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  )
}
