'use client'

import Script from 'next/script'
import { 
  generatePageSchemas, 
  generateToolSchema, 
  generateOrganizationSchema,
  generateFAQSchema,
  generateProductSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema
} from '@/lib/schema'

// Main Schema component - renders JSON-LD structured data
export function SchemaMarkup({ type, data = {} }) {
  const schemas = generatePageSchemas(type, data)
  
  if (!schemas.length) return null
  
  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={`schema-${type}-${index}`}
          id={`schema-${type}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          strategy="afterInteractive"
        />
      ))}
    </>
  )
}

// Specific schema components for different page types
export function HomepageSchema({ faqs }) {
  return <SchemaMarkup type="homepage" data={{ faqs }} />
}

export function ToolSchema({ toolId, toolData, faqs }) {
  return <SchemaMarkup type="tool" data={{ toolId, toolData, faqs }} />
}

export function AboutSchema(props) {
  return <SchemaMarkup type="about" data={props} />
}

export function PricingSchema({ faqs }) {
  return <SchemaMarkup type="pricing" data={{ faqs }} />
}

export function FAQSchema({ faqs }) {
  return <SchemaMarkup type="faq" data={{ faqs }} />
}

// Custom schema component - allows passing raw schema objects
export function CustomSchema({ schemas }) {
  if (!schemas) return null
  const schemaArray = Array.isArray(schemas) ? schemas : [schemas]
  
  return (
    <>
      {schemaArray.map((schema, index) => (
        <Script
          key={`custom-schema-${index}`}
          id={`custom-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          strategy="afterInteractive"
        />
      ))}
    </>
  )
}

// Hook to use page schema data (if fetched from database)
export function usePageSchema(pageId) {
  // This could be extended to fetch schema customizations from the database
  return {
    faqs: [],
    customSchema: null
  }
}
