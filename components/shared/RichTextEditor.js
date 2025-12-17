'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  ChevronDown, List, Quote,
  Heading1, Heading2, Heading3, ListOrdered, 
  Lightbulb, AlertTriangle, Info, MessageSquare
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// ===== RICH TEXT EDITOR COMPONENT =====
// Reusable formatting toolbar for all PDF tools
export default function RichTextEditor({ value, onChange, placeholder, rows = 6, label }) {
  const textareaRef = useRef(null)
  
  // Get selected text from textarea
  const getSelection = () => {
    const textarea = textareaRef.current
    if (!textarea) return { start: 0, end: 0, text: '' }
    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      text: value.substring(textarea.selectionStart, textarea.selectionEnd)
    }
  }
  
  // Wrap selected text with prefix/suffix (for inline formatting like bold/italic)
  const wrapSelection = (prefix, suffix) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const { start, end, text } = getSelection()
    const selectedText = text || 'text'
    const before = value.substring(0, start)
    const after = value.substring(end)
    
    const newValue = before + prefix + selectedText + suffix + after
    onChange(newValue)
    
    setTimeout(() => {
      textarea.focus()
      const newStart = start + prefix.length
      const newEnd = newStart + selectedText.length
      textarea.setSelectionRange(newStart, newEnd)
    }, 0)
  }
  
  // Insert block formatting - uses selected text if available
  const insertBlock = (formatPrefix, formatSuffix = '', defaultText = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const { start, end, text } = getSelection()
    const selectedText = text || defaultText
    const before = value.substring(0, start)
    const after = value.substring(end)
    
    const needsNewlineBefore = before.length > 0 && !before.endsWith('\n')
    const prefix = needsNewlineBefore ? '\n\n' : ''
    
    const newValue = before + prefix + formatPrefix + selectedText + formatSuffix + after
    onChange(newValue)
    
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + prefix.length + formatPrefix.length + selectedText.length + formatSuffix.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }
  
  // Button handlers
  const handleBold = () => wrapSelection('**', '**')
  const handleItalic = () => wrapSelection('*', '*')
  const handleHeading1 = () => insertBlock('# ', '\n', 'Your Heading Here')
  const handleHeading2 = () => insertBlock('## ', '\n', 'Section Title')
  const handleHeading3 = () => insertBlock('### ', '\n', 'Subsection')
  const handleQuote = () => insertBlock('> ', '\n', 'Write your quote here')
  const handleBulletList = () => {
    const { text } = getSelection()
    if (text) {
      const lines = text.split('\n').filter(l => l.trim())
      const bulletText = lines.map(l => `- ${l.trim()}`).join('\n')
      insertBlock('', '\n', bulletText)
    } else {
      insertBlock('', '\n', '- First item\n- Second item\n- Third item')
    }
  }
  const handleNumberedList = () => {
    const { text } = getSelection()
    if (text) {
      const lines = text.split('\n').filter(l => l.trim())
      const numberedText = lines.map((l, i) => `${i + 1}. ${l.trim()}`).join('\n')
      insertBlock('', '\n', numberedText)
    } else {
      insertBlock('', '\n', '1. First step\n2. Second step\n3. Third step')
    }
  }
  const handleTipBox = () => insertBlock('[TIP] ', '\n', 'Your helpful tip or advice here')
  const handleNoteBox = () => insertBlock('[NOTE] ', '\n', 'Important information to remember')
  const handleWarningBox = () => insertBlock('[WARNING] ', '\n', 'Caution or warning message here')
  const handleHighlightBox = () => insertBlock('[HIGHLIGHT] ', '\n', 'Key point to emphasize')
  
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-muted rounded-t-lg border border-b-0">
        <TooltipProvider>
          {/* Bold Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 font-bold" onClick={handleBold}>
                B
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold (select text first)</TooltipContent>
          </Tooltip>
          
          {/* Italic Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 italic" onClick={handleItalic}>
                I
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic (select text first)</TooltipContent>
          </Tooltip>
          
          <div className="h-6 w-px bg-border mx-1" />
          
          {/* Headings Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Heading1 className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Headings</TooltipContent>
            </Tooltip>
            <DropdownMenuContent>
              <DropdownMenuLabel>Headings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleHeading1}>
                <Heading1 className="h-4 w-4" />
                <span className="ml-2">Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleHeading2}>
                <Heading2 className="h-4 w-4" />
                <span className="ml-2">Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleHeading3}>
                <Heading3 className="h-4 w-4" />
                <span className="ml-2">Heading 3</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Quote Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleQuote}>
                <Quote className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quote Block</TooltipContent>
          </Tooltip>
          
          {/* Lists Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <List className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Lists</TooltipContent>
            </Tooltip>
            <DropdownMenuContent>
              <DropdownMenuLabel>Lists</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleBulletList}>
                <List className="h-4 w-4" />
                <span className="ml-2">Bullet List</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNumberedList}>
                <ListOrdered className="h-4 w-4" />
                <span className="ml-2">Numbered List</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Highlight Boxes Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Lightbulb className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Highlight Boxes</TooltipContent>
            </Tooltip>
            <DropdownMenuContent>
              <DropdownMenuLabel>Highlight Boxes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleTipBox}>
                <Lightbulb className="h-4 w-4 text-green-500" />
                <span className="ml-2">💡 Tip Box</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNoteBox}>
                <Info className="h-4 w-4 text-blue-500" />
                <span className="ml-2">📝 Note Box</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleWarningBox}>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="ml-2">⚠️ Warning Box</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleHighlightBox}>
                <MessageSquare className="h-4 w-4 text-purple-500" />
                <span className="ml-2">✨ Highlight Box</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="h-6 w-px bg-border mx-1" />
          
          <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
            Select text, then click format • Or click to insert
          </span>
        </TooltipProvider>
      </div>
      
      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="rounded-t-none font-mono text-sm"
      />
    </div>
  )
}
