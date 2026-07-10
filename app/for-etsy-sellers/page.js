import EtsySellersClient from './EtsySellersClient'

export const metadata = {
 title: 'AI Tool for Etsy Printable Sellers. Create Listings 10x Faster',
 description: 'Create Etsy-ready planners, journals, coloring pages, and worksheets with AI. Complete product in under 30 minutes. High-res PDF download. First product free.',
 alternates: { canonical: 'https://procreators.io/for-etsy-sellers' },
 openGraph: {
 title: 'Create Etsy Printables 10x Faster With AI',
 description: 'ProCreators designs your complete Etsy printable product in under 30 minutes. Download. List. Earn.',
 url: 'https://procreators.io/for-etsy-sellers',
 type: 'website',
 },
 twitter: {
 card: 'summary_large_image',
 title: 'AI Tool for Etsy Sellers | ProCreators',
 description: 'Complete Etsy-ready printable in under 30 minutes. First product free.',
 },
}

export default function ForEtsySellersPage() {
 return <EtsySellersClient />
}
