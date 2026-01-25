import { Metadata } from 'next'
import { getPostBySlug } from '@/lib/blog-data'

interface Props {
    params: { slug: string }
    children: React.ReactNode
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const post = getPostBySlug(params.slug)

    if (!post) {
        return {
            title: 'Post Not Found | Reword Blog',
        }
    }

    return {
        title: `${post.title} | Reword Blog`,
        description: post.excerpt,
        keywords: post.tags.join(', '),
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: post.publishedAt,
            authors: [post.author.name],
            images: [
                {
                    url: post.image,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: [post.image],
        },
    }
}

export default function BlogPostLayout({ children }: Props) {
    return <>{children}</>
}
