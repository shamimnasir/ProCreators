import KdpPublishersClient from './KdpPublishersClient'

export const metadata = {
 title: 'AI Tool for Amazon KDP Publishers. Publish More Books, Earn More Royalties',
 description: 'ProCreators builds your complete KDP product, ebook, cover, interior pages, and listing copy, in under 2 hours. KDP-formatted PDF export included. First product free.',
 alternates: { canonical: 'https://procreators.io/for-kdp-publishers' },
 openGraph: {
 title: 'The Only AI Tool Built Specifically for Amazon KDP Publishers',
 description: 'Stop spending 15 hours per book. ProCreators generates a complete, KDP-ready product in under 2 hours.',
 url: 'https://procreators.io/for-kdp-publishers',
 type: 'website',
 },
 twitter: {
 card: 'summary_large_image',
 title: 'AI Tool for Amazon KDP Publishers | ProCreators',
 description: 'Complete KDP-ready product in under 2 hours. First product free.',
 },
}

export default function ForKdpPublishersPage() {
 return <KdpPublishersClient />
}
