'use client'

import { usePathname } from 'next/navigation'
import { ToolPageExtraContent } from '@/components/ToolPageRenderer'

export default function ToolsLayout({ children }) {
  const pathname = usePathname()
  
  // Extract toolId from pathname: /dashboard/tools/[toolId]
  const pathParts = pathname.split('/')
  const toolsIndex = pathParts.indexOf('tools')
  const toolId = toolsIndex >= 0 && pathParts[toolsIndex + 1] ? pathParts[toolsIndex + 1] : null
  
  return (
    <>
      {children}
      {toolId && <ToolPageExtraContent toolId={toolId} />}
    </>
  )
}
