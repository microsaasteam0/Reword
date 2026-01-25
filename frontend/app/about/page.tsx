import { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'About Reword - Mission & Team | AI Content Strategy',
  description: 'Discover the mission behind Reword. We empower creators and marketers to multiply their reach through AI-powered content transformation and social media optimization.',
  keywords: 'about Reword, content creator mission, AI content strategy, Entrext Labs, social media growth tools',
  openGraph: {
    title: 'Reword AI - Empowering Creators and Marketers',
    description: 'Learn about our mission to revolutionize content repurposing with intelligent AI solutions.',
    type: 'website',
  },
}

export default function AboutPage() {
  return <AboutClient />
}