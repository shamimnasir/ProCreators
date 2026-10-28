import Link from 'next/link'
import AmazonListingLandingClient from './AmazonListingLandingClient'

export const metadata = {
  title: 'Amazon Listing Writer for KDP & Etsy Sellers | ProCreators',
  description: 'Generate Amazon KDP and Etsy listing copy in one click. Keyword-front-loaded title, 7 benefit-driven bullet points, HTML-safe description, and 250-char backend keywords. Amazon A9 algorithm optimized.',
  alternates: { canonical: 'https://procreators.io/tools/amazon-listing' },
  openGraph: {
    title: 'Amazon Listing Writer for KDP & Etsy | ProCreators',
    description: 'Title + 7 bullets + description + backend keywords, Amazon A9 optimized. First listing free.',
    url: 'https://procreators.io/tools/amazon-listing',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amazon Listing Writer | ProCreators',
    description: 'Amazon KDP & Etsy listing copy in one click.',
  },
}

export default function AmazonListingLandingPage() {
  return <AmazonListingLandingClient />
}
