// Blog Post Page - Server Component with Dynamic Metadata
import { connectToDatabase } from '@/lib/mongodb'
import BlogPostClient from './BlogPostClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Generate metadata from the specific blog post
export async function generateMetadata({ params }) {
  try {
    const { slug } = await params
    const { db } = await connectToDatabase()
    const post = await db.collection('blog_posts').findOne({ slug, published: true })
    
    if (post) {
      return {
        title: post.seo?.metaTitle || post.title || 'Blog Post | ProCreators',
        description: post.seo?.metaDescription || post.excerpt || 'Read this article on ProCreators',
        keywords: post.seo?.keywords || post.tags?.join(', ') || '',
        openGraph: {
          title: post.seo?.metaTitle || post.title,
          description: post.seo?.metaDescription || post.excerpt,
          images: post.coverImage ? [post.coverImage] : [],
          type: 'article',
          publishedTime: post.publishedAt,
          authors: [post.author],
        },
      }
    }
    
    return {
      title: 'Blog Post | ProCreators',
      description: 'Read this article on ProCreators'
    }
  } catch (error) {
    console.error('[Blog SEO] Error:', error)
    return {
      title: 'Blog Post | ProCreators',
      description: 'Read this article on ProCreators'
    }
  }
}

export default function BlogPostPage() {
  return <BlogPostClient />
}
