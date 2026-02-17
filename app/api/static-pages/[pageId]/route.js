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
            { question: 'How much does it cost?', answer: 'We offer a free plan with 500 credits. Paid plans start at $19/month for Creator (19,000 credits), $49/month for Pro (49,000 credits), and $99/month for Business (99,000 credits).' },
            { question: 'What can I create?', answer: 'You can create AI videos, reels, thumbnails, ebooks, blog posts, social media content, educational materials, business documents, and 70+ other content types.' },
            { question: 'Do I need technical skills?', answer: 'No! ProCreators is designed for everyone. Our AI handles the complex work while you focus on your creative vision.' }
          ]
        }
      }
    ]
  },
  'solutions-creators': {
    title: 'For Content Creators',
    metaTitle: 'For Content Creators | ProCreators',
    metaDescription: 'How ProCreators helps content creators grow their audience and monetize their content with AI-powered tools.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Built for Content Creators',
          subtitle: 'Create engaging content 10x faster. Grow your audience. Monetize your passion.',
          alignment: 'center'
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Why Creators Love Us',
          columns: 3,
          items: [
            { icon: '🎬', title: 'Video Creation', description: 'Create viral reels, shorts, and long-form videos in minutes' },
            { icon: '📱', title: 'Social Media', description: 'Generate engaging posts, carousels, and threads instantly' },
            { icon: '💰', title: 'Monetize Faster', description: 'Create digital products and courses to sell' }
          ]
        }
      },
      {
        id: 'cta-1',
        type: 'cta',
        content: {
          title: 'Start Creating Today',
          subtitle: 'Join thousands of creators using ProCreators',
          buttonText: 'Get Started Free',
          buttonLink: '/login'
        }
      }
    ]
  },
  'solutions-marketers': {
    title: 'For Marketing Teams',
    metaTitle: 'For Marketing Teams | ProCreators',
    metaDescription: 'Scale your marketing content production with AI. Create engaging campaigns, social posts, and more.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Scale Your Marketing with AI',
          subtitle: 'Create weeks of content in hours. Maintain brand consistency. Drive results.',
          alignment: 'center'
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Marketing Superpowers',
          columns: 3,
          items: [
            { icon: '📊', title: 'Campaign Content', description: 'Generate ad copy, landing pages, and email campaigns' },
            { icon: '🎯', title: 'Brand Consistency', description: 'Keep your brand voice across all content' },
            { icon: '⚡', title: '10x Productivity', description: 'Do more with less. Scale without hiring.' }
          ]
        }
      },
      {
        id: 'cta-1',
        type: 'cta',
        content: {
          title: 'Transform Your Marketing',
          subtitle: 'See how teams are scaling with AI',
          buttonText: 'Start Free Trial',
          buttonLink: '/login'
        }
      }
    ]
  },
  'solutions-agencies': {
    title: 'For Agencies',
    metaTitle: 'For Agencies | ProCreators',
    metaDescription: 'White-label AI content creation for agencies. Scale your client work without scaling your team.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Agency-Grade AI Content',
          subtitle: 'Deliver more to clients. Scale without hiring. Increase your margins.',
          alignment: 'center'
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Built for Agencies',
          columns: 3,
          items: [
            { icon: '🏢', title: 'White Label', description: 'Brand as your own. Impress your clients.' },
            { icon: '👥', title: 'Team Collaboration', description: 'Multiple users, multiple clients, one platform' },
            { icon: '📈', title: 'Scale Profits', description: 'Increase margins while delivering more' }
          ]
        }
      },
      {
        id: 'cta-1',
        type: 'cta',
        content: {
          title: 'Scale Your Agency',
          subtitle: 'Join agencies already growing with ProCreators',
          buttonText: 'Book a Demo',
          buttonLink: '/contact'
        }
      }
    ]
  },
  'solutions-educators': {
    title: 'For Educators',
    metaTitle: 'For Educators | ProCreators',
    metaDescription: 'Create engaging educational content with AI. Build courses, worksheets, quizzes and more.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'AI-Powered Educational Content',
          subtitle: 'Create engaging courses, worksheets, and quizzes in minutes.',
          alignment: 'center'
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Perfect for Educators',
          columns: 3,
          items: [
            { icon: '📚', title: 'Course Creation', description: 'Build comprehensive courses and ebooks' },
            { icon: '📝', title: 'Worksheets & Quizzes', description: 'Generate practice materials instantly' },
            { icon: '🎥', title: 'Video Lessons', description: 'Create engaging video content for students' }
          ]
        }
      },
      {
        id: 'cta-1',
        type: 'cta',
        content: {
          title: 'Start Teaching with AI',
          subtitle: 'Join educators creating better content faster',
          buttonText: 'Get Started Free',
          buttonLink: '/login'
        }
      }
    ]
  },
  community: {
    title: 'Community',
    metaTitle: 'Community | ProCreators',
    metaDescription: 'Join the ProCreators community. Connect with fellow creators, share tips, and get support.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Join Our Community',
          subtitle: 'Connect with thousands of creators. Learn, share, and grow together.',
          alignment: 'center'
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Community Benefits',
          columns: 3,
          items: [
            { icon: '💬', title: 'Discord Server', description: 'Join our active Discord community' },
            { icon: '🎓', title: 'Learning Resources', description: 'Access tutorials and guides' },
            { icon: '🤝', title: 'Networking', description: 'Connect with other creators' }
          ]
        }
      },
      {
        id: 'cta-1',
        type: 'cta',
        content: {
          title: 'Join the Community',
          subtitle: 'Be part of something bigger',
          buttonText: 'Join Discord',
          buttonLink: 'https://discord.gg/procreators'
        }
      }
    ]
  },
  status: {
    title: 'System Status',
    metaTitle: 'System Status | ProCreators',
    metaDescription: 'Check the current status of ProCreators services.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'System Status',
          subtitle: 'All systems operational',
          badge: '✅ Operational',
          alignment: 'center'
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Service Status',
          columns: 3,
          items: [
            { icon: '✅', title: 'API', description: 'Operational' },
            { icon: '✅', title: 'Dashboard', description: 'Operational' },
            { icon: '✅', title: 'AI Generation', description: 'Operational' }
          ]
        }
      }
    ]
  },
  security: {
    title: 'Security',
    metaTitle: 'Security | ProCreators',
    metaDescription: 'Learn about ProCreators security measures, data protection, and privacy practices.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Security at ProCreators',
          subtitle: 'Your data security is our top priority.',
          alignment: 'center'
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Our Security Measures',
          columns: 3,
          items: [
            { icon: '🔒', title: 'Encryption', description: 'All data encrypted in transit and at rest' },
            { icon: '🛡️', title: 'SOC 2 Compliant', description: 'Enterprise-grade security standards' },
            { icon: '🔐', title: 'Regular Audits', description: 'Continuous security monitoring and testing' }
          ]
        }
      },
      {
        id: 'para-1',
        type: 'paragraph',
        content: {
          text: 'At ProCreators, we take security seriously. We use industry-standard encryption, follow best practices for data protection, and regularly audit our systems to ensure your content and data are safe.'
        }
      }
    ]
  },
  faq: {
    title: 'Frequently Asked Questions',
    metaTitle: 'FAQ | ProCreators',
    metaDescription: 'Find answers to common questions about ProCreators AI content creation platform.',
    contentBlocks: [
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Frequently Asked Questions',
          subtitle: 'Find answers to common questions about ProCreators',
          alignment: 'center'
        }
      },
      {
        id: 'faq-general',
        type: 'faq',
        content: {
          title: 'General Questions',
          items: [
            { question: 'What is ProCreators?', answer: 'ProCreators is an AI-powered content creation platform that helps you generate professional videos, images, documents, and more using advanced AI technology.' },
            { question: 'How does the free trial work?', answer: 'Start with our free trial to explore all features. You get 100 credits to test AI tools. No credit card required to sign up.' },
            { question: 'What types of content can I create?', answer: 'You can create AI videos, social media graphics, business documents, ebooks, presentations, quizzes, storybooks, and much more with our 70+ AI tools.' }
          ]
        }
      },
      {
        id: 'faq-pricing',
        type: 'faq',
        content: {
          title: 'Pricing & Billing',
          items: [
            { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. Enterprise customers can also pay via invoice.' },
            { question: 'Can I cancel my subscription anytime?', answer: 'Yes, you can cancel your subscription at any time from your dashboard. Your access continues until the end of your billing period.' },
            { question: 'Do you offer refunds?', answer: 'We offer a 7-day money-back guarantee for new subscribers. Contact our support team if you are not satisfied with the service.' }
          ]
        }
      },
      {
        id: 'faq-technical',
        type: 'faq',
        content: {
          title: 'Technical Questions',
          items: [
            { question: 'What file formats are supported?', answer: 'We support various formats including MP4 for videos, PNG/JPG for images, PDF for documents, and more depending on the tool.' },
            { question: 'Is my content stored securely?', answer: 'Yes, all content is encrypted and stored securely. We use industry-standard security practices to protect your data.' },
            { question: 'Can I use the content commercially?', answer: 'Yes, all content you create with ProCreators can be used for commercial purposes. You retain full rights to your creations.' }
          ]
        }
      },
      {
        id: 'cta-1',
        type: 'cta',
        content: {
          title: 'Still Have Questions?',
          subtitle: 'Our support team is here to help',
          buttonText: 'Contact Support',
          buttonLink: '/contact'
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
