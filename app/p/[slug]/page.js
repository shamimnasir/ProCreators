// Dynamic page route for custom pages created via Page Manager
import { StaticPage } from '@/components/StaticPage'
import { connectToDatabase } from '@/lib/mongodb'
import { notFound } from 'next/navigation'

// Generate metadata dynamically
export async function generateMetadata({ params }) {
  const { slug } = await params
  
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection('custom_pages')
    
    const page = await collection.findOne({ path: `/p/${slug}` })
    
    if (!page) {
      return { title: 'Page Not Found | ProCreators' }
    }
    
    return {
      title: page.seo?.metaTitle || `${page.title} | ProCreators`,
      description: page.seo?.metaDescription || page.title,
      openGraph: {
        title: page.seo?.metaTitle || page.title,
        description: page.seo?.metaDescription || page.title,
        images: page.seo?.ogImage ? [page.seo.ogImage] : []
      }
    }
  } catch (error) {
    return { title: 'Page Not Found | ProCreators' }
  }
}

export default async function CustomPage({ params }) {
  const { slug } = await params
  
  try {
    const { db } = await connectToDatabase()
    const collection = db.collection('custom_pages')
    
    const page = await collection.findOne({ path: `/p/${slug}` })
    
    if (!page || !page.isPublished) {
      notFound()
    }
    
    return <StaticPage pageId={page.pageId} />
  } catch (error) {
    notFound()
  }
}
