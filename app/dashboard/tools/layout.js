'use client'

import { usePathname } from 'next/navigation'
import { ToolPageExtraContent } from '@/components/ToolPageRenderer'
import { ToolSchema } from '@/components/SchemaMarkup'

export default function ToolsLayout({ children }) {
  const pathname = usePathname()
  
  // Extract toolId from pathname: /dashboard/tools/[toolId]
  const pathParts = pathname.split('/')
  const toolsIndex = pathParts.indexOf('tools')
  const toolId = toolsIndex >= 0 && pathParts[toolsIndex + 1] ? pathParts[toolsIndex + 1] : null
  
  return (
    <>
      {/* Schema.org structured data for tool page */}
      {toolId && <ToolSchema toolId={toolId} />}
      
      {children}
      
      {/* Extra content from Page Manager */}
      {toolId && <ToolPageExtraContent toolId={toolId} />}
    </>
  )
}
