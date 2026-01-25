import { Metadata } from 'next'
import FeaturesClient from './FeaturesClient'

export const metadata: Metadata = {
  title: 'Features - AI Content Repurposing Capabilities | Reword',
  description: 'Explore the powerful AI features of Reword. Transform blogs into Twitter threads, newsletters into LinkedIn posts, and articles into Instagram carousels automatically.',
  keywords: 'AI content repurposing features, Twitter thread generator, LinkedIn post optimizer, Instagram carousel content, automated content transformation',
  openGraph: {
    title: 'Reword AI Features - Intelligent Content Transformation',
    description: 'Powerful AI-driven features to optimize your content for every social platform.',
    type: 'website',
  },
}

export default function Features() {
  return <FeaturesClient />
}