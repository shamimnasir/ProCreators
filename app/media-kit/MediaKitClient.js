'use client'

import { PublicLayout } from '@/components/shared/PublicLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileImage, FileCode, Image, Palette } from 'lucide-react'
import { useState } from 'react'

export default function MediaKitClient() {
  const [downloading, setDownloading] = useState(null)

  const logoVariants = [
    {
      name: 'Primary Logo',
      description: 'Full color gradient logo - use this as the primary logo',
      files: [
        { name: 'logo-icon.svg', label: 'SVG (Vector)', type: 'svg' },
        { name: 'logo-icon-512.png', label: 'PNG 512×512', type: 'png' },
        { name: 'logo-icon-1024.png', label: 'PNG 1024×1024', type: 'png' },
      ],
      preview: '/media-kit/logo-icon.svg',
      bg: 'bg-white'
    },
    {
      name: 'Logo with Text',
      description: 'Horizontal logo with ProCreators text - for light backgrounds',
      files: [
        { name: 'logo-full.svg', label: 'SVG (Vector)', type: 'svg' },
        { name: 'logo-full-lg.png', label: 'PNG 800px', type: 'png' },
        { name: 'logo-full-xl.png', label: 'PNG 1600px', type: 'png' },
      ],
      preview: '/media-kit/logo-full.svg',
      bg: 'bg-white'
    },
    {
      name: 'Logo with Text (White)',
      description: 'White text version - for dark backgrounds',
      files: [
        { name: 'logo-full-white.svg', label: 'SVG (Vector)', type: 'svg' },
        { name: 'logo-full-white-lg.png', label: 'PNG 800px', type: 'png' },
        { name: 'logo-full-white-xl.png', label: 'PNG 1600px', type: 'png' },
      ],
      preview: '/media-kit/logo-full-white.svg',
      bg: 'bg-gray-900'
    },
    {
      name: 'Monochrome Purple',
      description: 'Solid purple - when gradient is not suitable',
      files: [
        { name: 'logo-mono-purple.svg', label: 'SVG (Vector)', type: 'svg' },
        { name: 'logo-mono-purple-512.png', label: 'PNG 512×512', type: 'png' },
      ],
      preview: '/media-kit/logo-mono-purple.svg',
      bg: 'bg-white'
    },
    {
      name: 'Monochrome Black',
      description: 'Dark version - for light backgrounds',
      files: [
        { name: 'logo-mono-black.svg', label: 'SVG (Vector)', type: 'svg' },
        { name: 'logo-mono-black-512.png', label: 'PNG 512×512', type: 'png' },
      ],
      preview: '/media-kit/logo-mono-black.svg',
      bg: 'bg-white'
    },
    {
      name: 'Monochrome White',
      description: 'White outline - for dark/colored backgrounds',
      files: [
        { name: 'logo-mono-white.svg', label: 'SVG (Vector)', type: 'svg' },
      ],
      preview: '/media-kit/logo-mono-white.svg',
      bg: 'bg-gray-900'
    },
  ]

  const socialAssets = [
    {
      name: 'Social Banner',
      description: 'Open Graph / Social sharing image (1200×630)',
      files: [
        { name: 'social-banner.svg', label: 'SVG', type: 'svg' },
        { name: 'social-banner.png', label: 'PNG', type: 'png' },
      ],
      preview: '/media-kit/social-banner.svg',
      wide: true
    },
    {
      name: 'Favicon',
      description: 'Browser favicon and app icon',
      files: [
        { name: 'favicon.svg', label: 'SVG', type: 'svg' },
        { name: 'favicon-32.png', label: 'PNG 32×32', type: 'png' },
        { name: 'apple-touch-icon.png', label: 'Apple Touch Icon', type: 'png' },
      ],
      preview: '/media-kit/favicon.svg',
    },
  ]

  const brandColors = [
    { name: 'Purple Primary', hex: '#7c3aed', rgb: 'rgb(124, 58, 237)' },
    { name: 'Purple Light', hex: '#8b5cf6', rgb: 'rgb(139, 92, 246)' },
    { name: 'Purple Lighter', hex: '#a78bfa', rgb: 'rgb(167, 139, 250)' },
    { name: 'Dark', hex: '#1f2937', rgb: 'rgb(31, 41, 55)' },
    { name: 'White', hex: '#ffffff', rgb: 'rgb(255, 255, 255)' },
  ]

  const handleDownload = (filename) => {
    setDownloading(filename)
    const link = document.createElement('a')
    link.href = `/media-kit/${filename}`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => setDownloading(null), 1000)
  }

  const downloadAll = async () => {
    setDownloading('all')
    // Download main files
    const mainFiles = [
      'logo-icon.svg', 'logo-icon-512.png', 'logo-icon-1024.png',
      'logo-full.svg', 'logo-full-xl.png',
      'logo-full-white.svg', 'logo-full-white-xl.png',
      'social-banner.png', 'favicon.svg'
    ]
    
    for (const file of mainFiles) {
      handleDownload(file)
      await new Promise(r => setTimeout(r, 300))
    }
    setDownloading(null)
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 glass-badge bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium mb-4">
              <Palette className="inline h-4 w-4 mr-1" />
              Brand Assets
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Media Kit</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Download official ProCreators logos and brand assets for press, partnerships, and integrations.
            </p>
            <Button onClick={downloadAll} size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl shadow-lg">
              <Download className="mr-2 h-5 w-5" />
              {downloading === 'all' ? 'Downloading...' : 'Download All Assets'}
            </Button>
          </div>
        </div>
      </section>

      {/* Logo Variants */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">Logo Variants</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {logoVariants.map((variant, i) => (
              <Card key={i} className="overflow-hidden">
                <div className={`${variant.bg} p-8 flex items-center justify-center h-40`}>
                  <img 
                    src={variant.preview} 
                    alt={variant.name}
                    className="max-h-24 max-w-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{variant.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{variant.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {variant.files.map((file, j) => (
                      <Button
                        key={j}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.name)}
                        disabled={downloading === file.name}
                      >
                        {file.type === 'svg' ? <FileCode className="h-3 w-3 mr-1" /> : <FileImage className="h-3 w-3 mr-1" />}
                        {downloading === file.name ? '...' : file.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Assets */}
      <section className="py-16 ">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">Social Media Assets</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {socialAssets.map((asset, i) => (
              <Card key={i} className={`overflow-hidden ${asset.wide ? 'md:col-span-2' : ''}`}>
                <div className="bg-gray-900 p-4 flex items-center justify-center">
                  <img 
                    src={asset.preview} 
                    alt={asset.name}
                    className={`${asset.wide ? 'max-h-48' : 'max-h-24'} max-w-full`}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{asset.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{asset.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {asset.files.map((file, j) => (
                      <Button
                        key={j}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.name)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {file.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Colors */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">Brand Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {brandColors.map((color, i) => (
              <Card key={i} className="overflow-hidden">
                <div 
                  className="h-24"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1">{color.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{color.hex}</p>
                  <p className="text-xs text-muted-foreground font-mono">{color.rgb}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Guidelines */}
      <section className="py-16 ">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">Usage Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="glass-card p-6">
              <h3 className="font-semibold text-green-500 mb-4">✓ Do</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use the logo with adequate spacing around it</li>
                <li>• Use SVG files for web and digital use</li>
                <li>• Use PNG files when vector format isn't supported</li>
                <li>• Use white text logo on dark backgrounds</li>
                <li>• Maintain aspect ratio when scaling</li>
              </ul>
            </Card>
            <Card className="glass-card p-6">
              <h3 className="font-semibold text-red-500 mb-4">✗ Don't</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Don't stretch or distort the logo</li>
                <li>• Don't change the logo colors</li>
                <li>• Don't add effects like shadows or glows</li>
                <li>• Don't place logo on busy backgrounds</li>
                <li>• Don't rotate the logo</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
