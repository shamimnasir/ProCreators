'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Upload, Download, ImageIcon, Type, Sparkles, Wand2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import Image from 'next/image'

export default function ThumbnailMakerPage() {
  const [uploadType, setUploadType] = useState('image')
  const [file, setFile] = useState(null)
  const [fileUrl, setFileUrl] = useState('')
  const [thumbnailStyle, setThumbnailStyle] = useState('drama')
  const [overlayText, setOverlayText] = useState('')
  const [textPosition, setTextPosition] = useState('center')
  const [outputFormat, setOutputFormat] = useState('16:9')
  const [faceEnhance, setFaceEnhance] = useState(true)
  const [aiUpscale, setAiUpscale] = useState(true)
  const [loading, setLoading] = useState(false)
  const [generatedThumbnail, setGeneratedThumbnail] = useState(null)
  const fileInputRef = useRef(null)
  const { toast } = useToast()

  const thumbnailStyles = [
    { value: 'drama', label: 'Drama', colors: 'Red/Orange with high contrast' },
    { value: 'news', label: 'News', colors: 'Professional blue/white' },
    { value: 'educational', label: 'Educational', colors: 'Clean, minimal design' },
    { value: 'meme', label: 'Meme', colors: 'Bold yellow text with impact' },
  ]

  const outputFormats = [
    { value: '16:9', label: '16:9 (YouTube)', dimensions: '1280x720' },
    { value: '1:1', label: '1:1 (Instagram)', dimensions: '1080x1080' },
    { value: '9:16', label: '9:16 (Stories)', dimensions: '1080x1920' },
  ]

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0]
    if (uploadedFile) {
      const isVideo = uploadedFile.type.startsWith('video/')
      const isImage = uploadedFile.type.startsWith('image/')
      
      if ((uploadType === 'video' && !isVideo) || (uploadType === 'image' && !isImage)) {
        toast({
          title: "Error",
          description: `Please upload a valid ${uploadType} file`,
          variant: "destructive"
        })
        return
      }

      setFile(uploadedFile)
      const url = URL.createObjectURL(uploadedFile)
      setFileUrl(url)
      toast({
        title: "File uploaded",
        description: `${uploadedFile.name} ready for processing`
      })
    }
  }

  const handleGenerateThumbnail = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please upload an image or video first",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Simulate thumbnail generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // In production, this would:
      // 1. Extract key frame (for videos)
      // 2. AI upscale the image
      // 3. Apply face enhancement
      // 4. Add text overlays with styling
      // 5. Apply the selected style preset
      // 6. Format to selected aspect ratio
      
      setGeneratedThumbnail({
        url: fileUrl, // In production, this would be the processed thumbnail
        format: outputFormat,
        style: thumbnailStyle
      })

      toast({
        title: "Success",
        description: "Thumbnail generated successfully!"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (format) => {
    toast({
      title: "Download started",
      description: `Downloading ${format} thumbnail...`
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Thumbnail Maker</h1>
        <p className="text-muted-foreground mt-1">
          Create eye-catching thumbnails with AI enhancement and text overlays
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input & Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Upload & Settings</CardTitle>
            <CardDescription>Configure your thumbnail settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Type */}
            <div className="space-y-2">
              <Label>Upload Type</Label>
              <Tabs value={uploadType} onValueChange={setUploadType}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image">Image</TabsTrigger>
                  <TabsTrigger value="video">Video</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept={uploadType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {file ? file.name : `Choose ${uploadType === 'image' ? 'Image' : 'Video'}`}
              </Button>
            </div>

            {/* Style Preset */}
            <div className="space-y-2">
              <Label>Thumbnail Style</Label>
              <Select value={thumbnailStyle} onValueChange={setThumbnailStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {thumbnailStyles.map(style => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label} - {style.colors}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Text Overlay */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Text Overlay
              </Label>
              <Textarea
                placeholder="Enter thumbnail text..."
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                rows={2}
              />
            </div>

            {/* Text Position */}
            <div className="space-y-2">
              <Label>Text Position</Label>
              <Select value={textPosition} onValueChange={setTextPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Output Format */}
            <div className="space-y-2">
              <Label>Output Format</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {outputFormats.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label} ({format.dimensions})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Enhancements */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Face Enhancement
                </Label>
                <Switch
                  checked={faceEnhance}
                  onCheckedChange={setFaceEnhance}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  AI Upscale (4K)
                </Label>
                <Switch
                  checked={aiUpscale}
                  onCheckedChange={setAiUpscale}
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateThumbnail}
              disabled={!file || loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ImageIcon className="mr-2 h-4 w-4" />
              Generate Thumbnail
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Your thumbnail preview</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedThumbnail ? (
              <div className="space-y-4">
                {/* Thumbnail Preview */}
                <div className={`relative rounded-lg overflow-hidden border ${
                  outputFormat === '16:9' ? 'aspect-video' :
                  outputFormat === '1:1' ? 'aspect-square' :
                  'aspect-[9/16]'
                }`}>
                  {fileUrl && (
                    uploadType === 'image' ? (
                      <Image
                        src={fileUrl}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={fileUrl}
                        className="w-full h-full object-cover"
                      />
                    )
                  )}
                  
                  {/* Text Overlay Preview */}
                  {overlayText && (
                    <div className={`absolute inset-0 flex items-${textPosition === 'top' ? 'start' : textPosition === 'bottom' ? 'end' : 'center'} justify-center p-8`}>
                      <div className={`
                        text-4xl font-black text-center px-6 py-3 rounded-lg
                        ${thumbnailStyle === 'drama' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white' : ''}
                        ${thumbnailStyle === 'news' ? 'bg-blue-600 text-white' : ''}
                        ${thumbnailStyle === 'educational' ? 'bg-white text-black' : ''}
                        ${thumbnailStyle === 'meme' ? 'bg-yellow-400 text-black border-4 border-black' : ''}
                      `}>
                        {overlayText}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhancement Badges */}
                <div className="flex gap-2">
                  {faceEnhance && (
                    <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                      Face Enhanced
                    </div>
                  )}
                  {aiUpscale && (
                    <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                      AI Upscaled 4K
                    </div>
                  )}
                </div>

                {/* Download Options */}
                <div className="space-y-2">
                  <Label>Download Formats</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {outputFormats.map(format => (
                      <Button
                        key={format.value}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(format.value)}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {format.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {file ? 'Click "Generate Thumbnail" to create' : 'Upload a file to get started'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Style Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Style Presets</CardTitle>
          <CardDescription>Preview of available thumbnail styles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {thumbnailStyles.map(style => (
              <div
                key={style.value}
                className={`cursor-pointer rounded-lg border-2 transition-all ${
                  thumbnailStyle === style.value ? 'border-primary' : 'border-transparent'
                }`}
                onClick={() => setThumbnailStyle(style.value)}
              >
                <div className={`aspect-video rounded-t-lg flex items-center justify-center text-2xl font-black
                  ${style.value === 'drama' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white' : ''}
                  ${style.value === 'news' ? 'bg-blue-600 text-white' : ''}
                  ${style.value === 'educational' ? 'bg-white text-black' : ''}
                  ${style.value === 'meme' ? 'bg-yellow-400 text-black' : ''}
                `}>
                  {style.label}
                </div>
                <div className="p-2 text-center">
                  <p className="text-xs text-muted-foreground">{style.colors}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
