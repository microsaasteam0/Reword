import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Blog - AI Content Repurposing Insights | Reword',
    description: 'Master the art of content repurposing with Reword. Insights on transforming blogs, articles, and newsletters into viral social media content using AI.',
    keywords: 'content marketing blog, AI writing tips, social media strategy, blog repurposing guide, LinkedIn growth tips',
    openGraph: {
        title: 'Reword AI Blog - Content Strategy & Repurposing Insights',
        description: 'Expert advice on multiplying your content reach using intelligent AI automation.',
        type: 'website',
    },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
