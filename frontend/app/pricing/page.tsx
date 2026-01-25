import { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Pricing - Reword AI Content Repurposing Plans',
  description: 'Choose the best plan for your content strategy. From our Free tier to professional AI repurposing, compare Reword plans for X, LinkedIn, and Instagram optimization.',
  keywords: 'Reword pricing, AI content repurposing cost, social media automation plans, professional content transformation',
  openGraph: {
    title: 'Reword AI - Professional Pricing Plans',
    description: 'Affordable AI-powered content repurposing for creators and marketers.',
    type: 'website',
  },
}

export default function Pricing() {
  return <PricingClient />
}