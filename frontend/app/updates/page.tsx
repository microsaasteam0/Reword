import { Metadata } from 'next'
import UpdatesClient from './UpdatesClient'

export const metadata: Metadata = {
  title: 'Product Updates & Changelog | Reword AI Improvement',
  description: 'Stay informed about the latest Reword features, AI enhancements, and platform improvements. Track our journey in making content repurposing easier.',
  keywords: 'Reword updates, AI changelog, new content features, social media tool updates, product roadmap',
  openGraph: {
    title: 'Reword AI Updates - What\'s New in Content Transformation',
    description: 'Latest feature releases and AI improvements for the Reword platform.',
    type: 'website',
  },
}

export default function UpdatesPage() {
  return <UpdatesClient />
}