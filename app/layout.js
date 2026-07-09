import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/contexts/AuthContext'
import { CustomScripts } from '@/components/CustomScripts'

const inter = Inter({ subsets: ['latin'] })

// Global metadata, page-level generateMetadata may override.
export const metadata = {
 metadataBase: new URL('https://procreators.io'),
 title: {
 default: 'ProCreators. AI Publishing Studio for Amazon KDP & Etsy Sellers',
 template: '%s | ProCreators'
 },
 description: 'AI-powered publishing studio for Amazon KDP and Etsy sellers. Create complete ebooks, journals, planners, and coloring books in under 30 minutes. First product free.',
 keywords: [
 'KDP AI tool',
 'AI ebook creator',
 'Amazon KDP publisher tool',
 'AI journal maker',
 'AI planner creator',
 'coloring book AI generator',
 'Etsy printable creator AI',
 'low content book AI',
 'KDP cover generator',
 'AI book interior pages',
 'Amazon listing writer AI',
 'self publishing AI tool',
 'digital product creator AI',
 'KDP niche research tool'
 ],
 authors: [{ name: 'ProCreators', url: 'https://procreators.io' }],
 creator: 'ProCreators',
 robots: {
 index: true,
 follow: true,
 googleBot: { index: true, follow: true }
 },
 openGraph: {
 type: 'website',
 locale: 'en_US',
 url: 'https://procreators.io',
 siteName: 'ProCreators',
 title: 'ProCreators. AI Publishing Studio for Amazon KDP & Etsy Sellers',
 description: 'Create complete KDP and Etsy products in under 30 minutes. Ebook, cover, interior pages, and Amazon listing, done in one session.'
 },
 twitter: {
 card: 'summary_large_image',
 title: 'ProCreators. AI Publishing Studio for KDP & Etsy Sellers',
 description: 'Publish 10x more books on Amazon and Etsy. AI builds your complete product in under 30 minutes.'
 },
 icons: {
 icon: '/favicon.svg',
 },
}

// Global Organization + WebSite JSON-LD (used by Google, ChatGPT, Perplexity, Claude to understand the brand).
const organizationJsonLd = {
 '@context': 'https://schema.org',
 '@graph': [
 {
 '@type': 'Organization',
 '@id': 'https://procreators.io/#organization',
 name: 'ProCreators',
 url: 'https://procreators.io',
 logo: 'https://procreators.io/logo.png',
 description: 'AI-powered publishing studio for Amazon KDP and Etsy sellers. Creates complete digital products, ebooks, journals, planners, coloring books, in under 30 minutes.',
 sameAs: [
 'https://twitter.com/ProCreatorsIO',
 'https://youtube.com/@procreators'
 ]
 },
 {
 '@type': 'WebSite',
 '@id': 'https://procreators.io/#website',
 url: 'https://procreators.io',
 name: 'ProCreators',
 description: 'AI publishing studio for KDP and Etsy sellers',
 publisher: { '@id': 'https://procreators.io/#organization' }
 }
 ]
}

export default function RootLayout({ children }) {
 return (
 <html lang="en" suppressHydrationWarning>
 <head>
 {/* Google Fonts for Bangla/Bengali support */}
 <link rel="preconnect" href="https://fonts.googleapis.com" />
 <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
 <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet" />
 {/* Force light mode on initial load - clear any dark mode class immediately */}
 <script
 dangerouslySetInnerHTML={{
 __html: `
 (function() {
 try {
 document.documentElement.classList.remove('dark');
 document.documentElement.style.colorScheme = 'light';
 localStorage.removeItem('pubtools-theme');
 localStorage.removeItem('theme');
 } catch (e) {}
 })();
 `,
 }}
 />
 {/* Global Organization + WebSite JSON-LD for LLM/GEO discovery */}
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
 />
 </head>
 <body className={inter.className} suppressHydrationWarning>
 <ThemeProvider 
 attribute="class" 
 defaultTheme="light"
 forcedTheme="light"
 enableSystem={false}
 storageKey="pubtools-theme"
 disableTransitionOnChange
 >
 <AuthProvider>
 {children}
 <Toaster />
 <CustomScripts />
 </AuthProvider>
 </ThemeProvider>
 </body>
 </html>
 )
}
