// Public Static Page API - Fetches page content for static pages (about, privacy, terms, etc.)
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

const COLLECTION_NAME = 'static_pages'

// Default page templates
const DEFAULT_TEMPLATES = {
  about: {
    title: 'About Us',
    metaTitle: 'About Us | ProCreators',
    metaDescription: 'Learn about ProCreators - the AI-powered content creation platform for creators.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'About ProCreators',
          subtitle: 'Empowering creators with AI-powered tools to dominate every platform.',
          alignment: 'center'
        }
      },
      {
        id: 'para-1',
        type: 'paragraph',
        content: {
          text: 'ProCreators is the ultimate AI-powered content creation platform. We help content creators, marketers, and businesses create professional-quality content in minutes, not hours.'
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Our Mission',
          columns: 3,
          items: [
            { icon: '🚀', title: 'Innovation', description: 'Pushing the boundaries of AI content creation' },
            { icon: '💡', title: 'Simplicity', description: 'Making professional content accessible to everyone' },
            { icon: '🎯', title: 'Results', description: 'Helping creators grow and monetize their content' }
          ]
        }
      }
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    metaTitle: 'Privacy Policy | ProCreators',
    metaDescription: 'ProCreators Privacy Policy - Learn how we collect, use, and protect your data.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Privacy Policy',
          subtitle: 'Your privacy is important to us. This policy explains how we handle your data.',
          alignment: 'center'
        }
      },
      {
        id: 'heading-1',
        type: 'heading',
        content: { text: 'Information We Collect', level: 2 }
      },
      {
        id: 'para-1',
        type: 'paragraph',
        content: {
          text: 'We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This may include your name, email address, and payment information.'
        }
      },
      {
        id: 'heading-2',
        type: 'heading',
        content: { text: 'How We Use Your Information', level: 2 }
      },
      {
        id: 'para-2',
        type: 'paragraph',
        content: {
          text: 'We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.'
        }
      }
    ]
  },
  terms: {
    title: 'Terms of Service',
    metaTitle: 'Terms of Service | ProCreators',
    metaDescription: 'ProCreators Terms of Service - Read our terms and conditions for using our platform.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Terms of Service',
          subtitle: 'Please read these terms carefully before using ProCreators.',
          alignment: 'center'
        }
      },
      {
        id: 'heading-1',
        type: 'heading',
        content: { text: 'Acceptance of Terms', level: 2 }
      },
      {
        id: 'para-1',
        type: 'paragraph',
        content: {
          text: 'By accessing or using ProCreators, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.'
        }
      },
      {
        id: 'heading-2',
        type: 'heading',
        content: { text: 'Use of Services', level: 2 }
      },
      {
        id: 'para-2',
        type: 'paragraph',
        content: {
          text: 'You may use our services only in compliance with these Terms and all applicable laws. You are responsible for all content you create using our platform.'
        }
      }
    ]
  },
  contact: {
    title: 'Contact Us',
    metaTitle: 'Contact Us | ProCreators',
    metaDescription: 'Get in touch with the ProCreators team. We\'re here to help!',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Contact Us',
          subtitle: 'Have questions? We\'d love to hear from you.',
          alignment: 'center'
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Get in Touch',
          columns: 3,
          items: [
            { icon: '📧', title: 'Email', description: 'support@procreators.io' },
            { icon: '💬', title: 'Live Chat', description: 'Available 24/7 in the dashboard' },
            { icon: '🐦', title: 'Twitter', description: '@procreators' }
          ]
        }
      }
    ]
  },
  careers: {
    title: 'Careers',
    metaTitle: 'Careers at ProCreators | Join Our Team',
    metaDescription: 'Join the ProCreators team. We\'re looking for talented individuals to help us build the future of content creation.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Join Our Team',
          subtitle: 'Help us build the future of AI-powered content creation.',
          alignment: 'center'
        }
      },
      {
        id: 'para-1',
        type: 'paragraph',
        content: {
          text: 'We\'re a fast-growing startup looking for passionate individuals who want to make an impact in the creator economy. If you\'re excited about AI, content creation, and helping creators succeed, we\'d love to hear from you.'
        }
      },
      {
        id: 'cta-1',
        type: 'cta',
        content: {
          title: 'Open Positions',
          subtitle: 'Check back soon for new opportunities!',
          buttonText: 'Email Us Your Resume',
          buttonLink: 'mailto:careers@procreators.io'
        }
      }
    ]
  },
  cookies: {
    title: 'Cookie Policy',
    metaTitle: 'Cookie Policy | ProCreators',
    metaDescription: 'Learn about how ProCreators uses cookies and similar technologies.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Cookie Policy',
          subtitle: 'How we use cookies to improve your experience.',
          alignment: 'center'
        }
      },
      {
        id: 'para-1',
        type: 'paragraph',
        content: {
          text: 'We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. By clicking accept, you agree to this use of cookies.'
        }
      }
    ]
  },
  homepage: {
    title: 'Homepage',
    metaTitle: 'ProCreators - AI-Powered Content Creation Platform',
    metaDescription: 'Create professional videos, images, ebooks, and more with AI. The ultimate content creation platform for creators.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Create Content That Dominates',
          subtitle: 'AI-powered tools to create professional videos, images, ebooks, and more in minutes.',
          badge: 'AI-Powered',
          alignment: 'center'
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Why Choose ProCreators?',
          columns: 3,
          items: [
            { icon: '⚡', title: 'Lightning Fast', description: 'Generate content in seconds, not hours' },
            { icon: '🎨', title: 'Professional Quality', description: 'Studio-grade output every time' },
            { icon: '💰', title: 'Cost Effective', description: 'Save thousands on content creation' }
          ]
        }
      },
      {
        id: 'faq-1',
        type: 'faq',
        content: {
          title: 'Frequently Asked Questions',
          items: [
            { question: 'What is ProCreators?', answer: 'ProCreators is an AI-powered content creation platform that helps you create professional videos, images, ebooks, social media content, and more.' },
            { question: 'How much does it cost?', answer: 'We offer a free plan with 50 credits. Paid plans start at $19/month for Creator, $49/month for Pro, and $99/month for Business.' },
            { question: 'What can I create?', answer: 'You can create AI videos, reels, thumbnails, ebooks, blog posts, social media content, educational materials, business documents, and 70+ other content types.' },
            { question: 'Do I need technical skills?', answer: 'No! ProCreators is designed for everyone. Our AI handles the complex work while you focus on your creative vision.' }
          ]
        }
      }
    ]
  }
}

// GET - Fetch static page content
export async function GET(request, { params }) {
  try {
    const { pageId } = await params
    
    if (!pageId) {
      return NextResponse.json({ success: false, error: 'pageId is required' }, { status: 400 })
    }
    
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    let page = await collection.findOne({ pageId })
    
    // If page doesn't exist, create from template
    if (!page && DEFAULT_TEMPLATES[pageId]) {
      const template = DEFAULT_TEMPLATES[pageId]
      page = {
        _id: uuidv4(),
        pageId,
        ...template,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await collection.insertOne(page)
    }
    
    if (!page) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      page: {
        pageId: page.pageId,
        title: page.title,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        contentBlocks: page.contentBlocks || [],
        isPublished: page.isPublished,
        updatedAt: page.updatedAt
      }
    })
    
  } catch (error) {
    console.error('Error fetching static page:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
