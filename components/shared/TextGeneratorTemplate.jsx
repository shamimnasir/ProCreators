'use client'

// =====================================================
// TextGeneratorTemplate
// Shared UI shell for text-first AI tools. Renders a config-driven form,
// calls a tool-specific API endpoint, and shows a copy-able + downloadable result.
// Used by: ai-prompt-pack, recipe-book, spreadsheet-template, wedding-suite, puzzle-book
// =====================================================
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Copy, Download, Loader2, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCsrf } from '@/hooks/use-csrf'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function TextGeneratorTemplate({ config }) {
  const { toolId, name, icon: Icon, tagline, apiPath, fields, exampleOutput, cta = 'Generate', bgGradient = 'from-orange-500 to-amber-500' } = config

  const { toast } = useToast()
  const { getCsrfHeaders } = useCsrf()
  const [formData, setFormData] = useState(() => {
    const init = {}
    for (const f of fields) init[f.id] = f.default ?? (f.type === 'select' ? f.options?.[0]?.value : '')
    return init
  })
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const setField = (id, val) => setFormData(prev => ({ ...prev, [id]: val }))

  const handleGenerate = async () => {
    // Validate required fields
    for (const f of fields) {
      if (f.required && !formData[f.id]) {
        toast({ title: 'Missing field', description: `Please fill in "${f.label}"`, variant: 'destructive' })
        return
      }
    }
    setGenerating(true)
    setResult(null)
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Generation failed')
      }
      setResult(data)
      toast({ title: 'Ready!', description: 'Your content has been generated.' })
    } catch (err) {
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.content) return
    await navigator.clipboard.writeText(result.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Copied to clipboard' })
  }

  const handleDownload = (kind = 'md') => {
    if (!result) return
    let text = result.content || ''
    let filename = `${toolId}-${Date.now()}.${kind === 'csv' ? 'csv' : 'md'}`
    let mime = kind === 'csv' ? 'text/csv' : 'text/markdown'
    if (kind === 'csv' && result.csv) { text = result.csv; }
    const blob = new Blob([text], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-2 rounded-lg bg-gradient-to-br ${bgGradient}`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{name}</h1>
          <p className="text-muted-foreground mt-1">{tagline}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map(f => (
              <div key={f.id} className="space-y-2">
                <Label htmlFor={f.id}>
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </Label>
                {f.type === 'textarea' ? (
                  <Textarea
                    id={f.id}
                    value={formData[f.id]}
                    onChange={(e) => setField(f.id, e.target.value)}
                    placeholder={f.placeholder}
                    rows={f.rows || 3}
                  />
                ) : f.type === 'select' ? (
                  <Select value={formData[f.id]} onValueChange={(v) => setField(f.id, v)}>
                    <SelectTrigger id={f.id}><SelectValue placeholder={f.placeholder || 'Select…'} /></SelectTrigger>
                    <SelectContent>
                      {f.options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === 'number' ? (
                  <Input
                    id={f.id}
                    type="number"
                    value={formData[f.id]}
                    onChange={(e) => setField(f.id, e.target.value)}
                    min={f.min}
                    max={f.max}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <Input
                    id={f.id}
                    value={formData[f.id]}
                    onChange={(e) => setField(f.id, e.target.value)}
                    placeholder={f.placeholder}
                  />
                )}
                {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
              </div>
            ))}
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className={`w-full bg-gradient-to-r ${bgGradient} text-white font-semibold`}
            >
              {generating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> {cta}</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Result</CardTitle>
            {result && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownload('md')}>
                  <Download className="h-4 w-4 mr-1" /> MD
                </Button>
                {result.csv && (
                  <Button size="sm" variant="outline" onClick={() => handleDownload('csv')}>
                    <Download className="h-4 w-4 mr-1" /> CSV
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {generating ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                <p>Building your {name.toLowerCase()}…</p>
              </div>
            ) : result?.content ? (
              <div className="prose prose-sm dark:prose-invert max-w-none max-h-[500px] overflow-y-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-16 text-center space-y-2">
                <p className="font-semibold text-foreground">What you&apos;ll get:</p>
                <p className="whitespace-pre-line">{exampleOutput}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
