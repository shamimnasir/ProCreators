'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'
import { 
  Settings, Palette, Home, Share2, FileText, BarChart3, 
  Save, Loader2, ExternalLink, Globe, Image, Type,
  Twitter, Facebook, Instagram, Linkedin, Youtube, MessageCircle,
  Code, Search, RefreshCw
} from 'lucide-react'

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [activeTab, setActiveTab] = useState('branding')
  const { toast } = useToast()
  const { getCsrfHeaders } = useCsrf()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/site-settings')
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings)
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const saveSection = async (section) => {
    setSaving(prev => ({ ...prev, [section]: true }))
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
        body: JSON.stringify({ section, data: settings[section] })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: '✅ Saved!', description: `${section} settings updated successfully` })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(prev => ({ ...prev, [section]: false }))
    }
  }

  const updateSettings = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const updateFooterLink = (index, field, value) => {
    const newLinks = [...settings.footer.links]
    newLinks[index] = { ...newLinks[index], [field]: value }
    updateSettings('footer', 'links', newLinks)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Site Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your site branding, content, and integrations
          </p>
        </div>
        <Button variant="outline" onClick={fetchSettings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="homepage" className="gap-2">
            <Home className="h-4 w-4" /> Homepage
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="h-4 w-4" /> Social
          </TabsTrigger>
          <TabsTrigger value="footer" className="gap-2">
            <FileText className="h-4 w-4" /> Footer
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Search className="h-4 w-4" /> SEO
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" /> Branding Settings
              </CardTitle>
              <CardDescription>Customize your site's identity and appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.branding.siteName}
                    onChange={(e) => updateSettings('branding', 'siteName', e.target.value)}
                    placeholder="ProCreators"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={settings.branding.tagline}
                    onChange={(e) => updateSettings('branding', 'tagline', e.target.value)}
                    placeholder="AI-Powered Content Creation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={settings.branding.logoUrl}
                    onChange={(e) => updateSettings('branding', 'logoUrl', e.target.value)}
                    placeholder="/logo.svg or https://..."
                  />
                  <p className="text-xs text-muted-foreground">Upload to your hosting or use external URL</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    value={settings.branding.faviconUrl}
                    onChange={(e) => updateSettings('branding', 'faviconUrl', e.target.value)}
                    placeholder="/favicon.svg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.branding.primaryColor}
                      onChange={(e) => updateSettings('branding', 'primaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.branding.primaryColor}
                      onChange={(e) => updateSettings('branding', 'primaryColor', e.target.value)}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={settings.branding.accentColor}
                      onChange={(e) => updateSettings('branding', 'accentColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.branding.accentColor}
                      onChange={(e) => updateSettings('branding', 'accentColor', e.target.value)}
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={() => saveSection('branding')} disabled={saving.branding}>
                {saving.branding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Branding
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homepage Tab */}
        <TabsContent value="homepage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" /> Homepage Settings
              </CardTitle>
              <CardDescription>Customize your landing page content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="heroTitle">Hero Title</Label>
                  <Input
                    id="heroTitle"
                    value={settings.homepage.heroTitle}
                    onChange={(e) => updateSettings('homepage', 'heroTitle', e.target.value)}
                    placeholder="Create Amazing Content with AI"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                  <Textarea
                    id="heroSubtitle"
                    value={settings.homepage.heroSubtitle}
                    onChange={(e) => updateSettings('homepage', 'heroSubtitle', e.target.value)}
                    placeholder="Generate viral videos, ebooks, images..."
                    rows={2}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heroCta">CTA Button Text</Label>
                    <Input
                      id="heroCta"
                      value={settings.homepage.heroCta}
                      onChange={(e) => updateSettings('homepage', 'heroCta', e.target.value)}
                      placeholder="Start Creating Free"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroCtaUrl">CTA Button URL</Label>
                    <Input
                      id="heroCtaUrl"
                      value={settings.homepage.heroCtaUrl}
                      onChange={(e) => updateSettings('homepage', 'heroCtaUrl', e.target.value)}
                      placeholder="/dashboard"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Section Visibility</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'showFeatures', label: 'Features Section' },
                    { key: 'showTestimonials', label: 'Testimonials Section' },
                    { key: 'showPricing', label: 'Pricing Section' },
                    { key: 'showFaq', label: 'FAQ Section' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <Label htmlFor={key}>{label}</Label>
                      <Switch
                        id={key}
                        checked={settings.homepage[key]}
                        onCheckedChange={(checked) => updateSettings('homepage', key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <Button onClick={() => saveSection('homepage')} disabled={saving.homepage}>
                {saving.homepage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Homepage
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" /> Social Media Links
              </CardTitle>
              <CardDescription>Connect your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/yourhandle' },
                  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourpage' },
                  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourhandle' },
                  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/yourcompany' },
                  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@yourchannel' },
                  { key: 'discord', label: 'Discord', icon: MessageCircle, placeholder: 'https://discord.gg/yourserver' }
                ].map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" /> {label}
                    </Label>
                    <Input
                      id={key}
                      value={settings.social[key]}
                      onChange={(e) => updateSettings('social', key, e.target.value)}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={() => saveSection('social')} disabled={saving.social}>
                {saving.social ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Social Links
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Footer Settings
              </CardTitle>
              <CardDescription>Customize footer content and links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="copyrightText">Copyright Text</Label>
                  <Input
                    id="copyrightText"
                    value={settings.footer.copyrightText}
                    onChange={(e) => updateSettings('footer', 'copyrightText', e.target.value)}
                    placeholder="© 2025 ProCreators. All rights reserved."
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="showSocialLinks">Show Social Links in Footer</Label>
                  <Switch
                    id="showSocialLinks"
                    checked={settings.footer.showSocialLinks}
                    onCheckedChange={(checked) => updateSettings('footer', 'showSocialLinks', checked)}
                  />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Footer Links</h3>
                <div className="space-y-3">
                  {settings.footer.links.map((link, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Switch
                        checked={link.enabled}
                        onCheckedChange={(checked) => updateFooterLink(index, 'enabled', checked)}
                      />
                      <Input
                        value={link.label}
                        onChange={(e) => updateFooterLink(index, 'label', e.target.value)}
                        placeholder="Link Label"
                        className="w-40"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateFooterLink(index, 'url', e.target.value)}
                        placeholder="/page or https://..."
                        className="flex-1"
                      />
                      <Badge variant={link.enabled ? 'default' : 'secondary'}>
                        {link.enabled ? 'Visible' : 'Hidden'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button onClick={() => saveSection('footer')} disabled={saving.footer}>
                {saving.footer ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Footer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Analytics & Tracking
              </CardTitle>
              <CardDescription>Add tracking codes for analytics platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                  <Input
                    id="googleAnalyticsId"
                    value={settings.analytics.googleAnalyticsId}
                    onChange={(e) => updateSettings('analytics', 'googleAnalyticsId', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="text-xs text-muted-foreground">Your GA4 Measurement ID</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
                  <Input
                    id="facebookPixelId"
                    value={settings.analytics.facebookPixelId}
                    onChange={(e) => updateSettings('analytics', 'facebookPixelId', e.target.value)}
                    placeholder="123456789012345"
                  />
                  <p className="text-xs text-muted-foreground">Your Meta Pixel ID</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitterPixelId">Twitter/X Pixel ID</Label>
                  <Input
                    id="twitterPixelId"
                    value={settings.analytics.twitterPixelId}
                    onChange={(e) => updateSettings('analytics', 'twitterPixelId', e.target.value)}
                    placeholder="xxxxxx"
                  />
                </div>
              </div>
              
              <div className="border-t pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customHeadScripts" className="flex items-center gap-2">
                    <Code className="h-4 w-4" /> Custom Head Scripts
                  </Label>
                  <Textarea
                    id="customHeadScripts"
                    value={settings.analytics.customHeadScripts}
                    onChange={(e) => updateSettings('analytics', 'customHeadScripts', e.target.value)}
                    placeholder="<!-- Paste any custom scripts here -->\n<script>...</script>"
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Scripts added to &lt;head&gt; section</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customBodyScripts" className="flex items-center gap-2">
                    <Code className="h-4 w-4" /> Custom Body Scripts
                  </Label>
                  <Textarea
                    id="customBodyScripts"
                    value={settings.analytics.customBodyScripts}
                    onChange={(e) => updateSettings('analytics', 'customBodyScripts', e.target.value)}
                    placeholder="<!-- Paste any custom scripts here -->\n<script>...</script>"
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Scripts added before &lt;/body&gt; tag</p>
                </div>
              </div>
              
              <Button onClick={() => saveSection('analytics')} disabled={saving.analytics}>
                {saving.analytics ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Analytics
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" /> SEO Settings
              </CardTitle>
              <CardDescription>Default meta tags for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultTitle">Default Page Title</Label>
                  <Input
                    id="defaultTitle"
                    value={settings.seo.defaultTitle}
                    onChange={(e) => updateSettings('seo', 'defaultTitle', e.target.value)}
                    placeholder="ProCreators - AI Content Creation Platform"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultDescription">Default Meta Description</Label>
                  <Textarea
                    id="defaultDescription"
                    value={settings.seo.defaultDescription}
                    onChange={(e) => updateSettings('seo', 'defaultDescription', e.target.value)}
                    placeholder="Create viral content with AI..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">{settings.seo.defaultDescription.length}/160 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultKeywords">Default Keywords</Label>
                  <Input
                    id="defaultKeywords"
                    value={settings.seo.defaultKeywords}
                    onChange={(e) => updateSettings('seo', 'defaultKeywords', e.target.value)}
                    placeholder="AI content creation, video generator, ebook maker"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ogImage">Default OG Image URL</Label>
                  <Input
                    id="ogImage"
                    value={settings.seo.ogImage}
                    onChange={(e) => updateSettings('seo', 'ogImage', e.target.value)}
                    placeholder="/og-image.png or https://..."
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 1200x630 pixels</p>
                </div>
              </div>
              <Button onClick={() => saveSection('seo')} disabled={saving.seo}>
                {saving.seo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save SEO Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
