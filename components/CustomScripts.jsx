'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export function CustomScripts() {
  const [scripts, setScripts] = useState({ head: '', body: '', gaId: '' })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function fetchScripts() {
      try {
        const res = await fetch('/api/site-settings')
        const data = await res.json()
        if (data.success && data.settings?.analytics) {
          setScripts({
            head: data.settings.analytics.customHeadScripts || '',
            body: data.settings.analytics.customBodyScripts || '',
            gaId: data.settings.analytics.googleAnalyticsId || ''
          })
        }
        setLoaded(true)
      } catch (error) {
        console.error('Error fetching custom scripts:', error)
        setLoaded(true)
      }
    }
    fetchScripts()
  }, [])

  // Execute scripts after loading
  useEffect(() => {
    if (!loaded) return

    // Execute HEAD scripts
    if (scripts.head) {
      executeScripts(scripts.head, 'head')
    }

    // Execute BODY scripts
    if (scripts.body) {
      executeScripts(scripts.body, 'body')
    }
  }, [loaded, scripts])

  // Helper function to execute script content
  const executeScripts = (scriptContent, location) => {
    try {
      // Create a temporary container
      const container = document.createElement('div')
      container.innerHTML = scriptContent
      
      // Find all script tags
      const scriptTags = container.querySelectorAll('script')
      
      scriptTags.forEach(oldScript => {
        const newScript = document.createElement('script')
        
        // Copy all attributes
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value)
        })
        
        // Copy the content if it's an inline script
        if (!oldScript.src && oldScript.textContent) {
          newScript.textContent = oldScript.textContent
        }
        
        // Append to appropriate location
        if (location === 'head') {
          document.head.appendChild(newScript)
        } else {
          document.body.appendChild(newScript)
        }
      })
      
      console.log(`[CustomScripts] Loaded ${scriptTags.length} ${location} scripts`)
    } catch (error) {
      console.error(`Error executing ${location} scripts:`, error)
    }
  }

  // Also render Google Analytics using Next.js Script component for better performance
  return (
    <>
      {loaded && scripts.gaId && (
        <>
          <Script 
            src={`https://www.googletagmanager.com/gtag/js?id=${scripts.gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${scripts.gaId}');
            `}
          </Script>
        </>
      )}
    </>
  )
}
