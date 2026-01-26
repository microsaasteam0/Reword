'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPostBySlug, getAllPosts } from '@/lib/blog-data';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedNavbar from '@/components/AuthenticatedNavbar';
import AuthModal from '@/components/AuthModal';

export default function BlogPostPage() {
    const { isAuthenticated } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

    const slug = params?.slug as string;
    const post = getPostBySlug(slug);
    const allPosts = getAllPosts();
    const relatedPosts = allPosts.filter(p => p.id !== post?.id).slice(0, 3);

    const handleGetStarted = () => {
        if (isAuthenticated) {
            router.push('/pricing');
        } else {
            setAuthModalMode('register');
            setShowAuthModal(true);
        }
    };

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
                    <Link href="/blog" className="text-blue-600 hover:underline">
                        ← Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            {isAuthenticated ? (
                <AuthenticatedNavbar activeTab="blog" />
            ) : (
                <Navbar
                    showAuthButtons={true}
                    onSignIn={() => {
                        setAuthModalMode('login');
                        setShowAuthModal(true);
                    }}
                    onSignUp={() => {
                        setAuthModalMode('register');
                        setShowAuthModal(true);
                    }}
                />
            )}

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode={authModalMode}
            />
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                {/* Header */}
                <div className="pt-8 pb-8 px-6">
                    <div className="max-w-4xl mx-auto">
                        <Link
                            href="/blog"
                            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8"
                        >
                            ← Back to Blog
                        </Link>

                        {/* Category & Read Time */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                            <span className="px-3 py-1 sm:px-4 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium border border-blue-200 dark:border-blue-800">
                                {post.category}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium flex items-center">
                                <span className="w-1 h-1 rounded-full bg-gray-400 mr-3"></span>
                                {post.readTime}
                            </span>
                            {post.featured && (
                                <span className="px-3 py-1 sm:px-4 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs sm:text-sm font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 shadow-sm">
                                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                    Featured
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                            {post.title}
                        </h1>

                        {/* Author & Date */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                {post.author.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {post.author.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {post.author.role} • {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="relative h-96 rounded-2xl overflow-hidden mb-12 bg-gradient-to-br from-blue-500 to-purple-600">
                            {post.image && (
                                <Image
                                    src={post.image}
                                    alt={post.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <article className="px-6 pb-20">
                    <div className="max-w-3xl mx-auto">
                        <div className="prose prose-xl dark:prose-invert max-w-none
                            leading-loose tracking-wide
                            
                            prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                            prose-h1:text-5xl prose-h1:leading-tight prose-h1:mb-10 prose-h1:mt-16
                            prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:border-l-4 prose-h2:border-blue-500 prose-h2:pl-4
                            prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-4
                            
                            prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-p:mb-8 prose-p:text-lg prose-p:leading-8
                            
                            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline hover:prose-a:text-blue-800 transition-colors
                            
                            prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-extrabold
                            
                            prose-ul:my-8 prose-ul:ml-6 prose-ul:list-none
                            prose-li:my-4 prose-li:relative prose-li:pl-2
                            
                            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:text-xl prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800/50 prose-blockquote:rounded-r-lg
                            
                            prose-img:rounded-2xl prose-img:shadow-xl prose-img:my-12
                            
                            prose-hr:border-gray-200 dark:prose-hr:border-gray-700 prose-hr:my-16
                        ">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Custom List Styling
                                    ul: ({ children }) => (
                                        <ul className="space-y-4 my-8 pl-2">{children}</ul>
                                    ),
                                    li: ({ children }) => (
                                        <li className="flex items-start gap-3">
                                            <span className="flex-shrink-0 mt-2.5 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                                            <span className="flex-1 text-lg leading-8">{children}</span>
                                        </li>
                                    ),
                                    // Enhanced Code Blocks
                                    code: ({ inline, children, ...props }: any) => {
                                        return inline ? (
                                            <code className="bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md text-base text-blue-700 dark:text-blue-300 font-mono font-medium border border-blue-100 dark:border-blue-800/50" {...props}>
                                                {children}
                                            </code>
                                        ) : (
                                            <code className="block bg-[#1e1e1e] text-gray-200 p-6 rounded-xl overflow-x-auto font-mono text-base leading-relaxed shadow-2xl border border-gray-800 my-8" {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    // Responsive Tables
                                    table: ({ children }) => (
                                        <div className="overflow-x-auto my-10 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                            <table className="w-full border-collapse bg-white dark:bg-gray-800 text-left">{children}</table>
                                        </div>
                                    ),
                                    // Table Headers
                                    thead: ({ children }) => (
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">{children}</thead>
                                    ),
                                    // Table Rows
                                    tr: ({ children }) => (
                                        <tr className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">{children}</tr>
                                    ),
                                    // Table Cells
                                    td: ({ children }) => (
                                        <td className="p-4 align-top text-gray-700 dark:text-gray-300 text-base">{children}</td>
                                    ),
                                    th: ({ children }) => (
                                        <th className="p-4 font-bold text-gray-900 dark:text-white text-base tracking-wide">{children}</th>
                                    ),
                                }}
                            >
                                {post.content}
                            </ReactMarkdown>
                        </div>

                        {/* Tags */}
                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                                Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </article>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <section className="px-6 py-16 bg-gray-50 dark:bg-gray-900">
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                                Related Posts
                            </h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {relatedPosts.map((relatedPost) => (
                                    <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                                        <article className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                            <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600">
                                                {relatedPost.image && (
                                                    <Image
                                                        src={relatedPost.image}
                                                        alt={relatedPost.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                                                    {relatedPost.category}
                                                </p>
                                                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-2">
                                                    {relatedPost.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {relatedPost.readTime}
                                                </p>
                                            </div>
                                        </article>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* CTA Section */}
                <section className="px-6 py-16">
                    <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Ready to Transform Your Content?
                        </h2>
                        <p className="text-white/90 mb-8 text-lg">
                            Start repurposing your content with Reword today
                        </p>
                        <button
                            onClick={handleGetStarted}
                            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
                        >
                            Get Started Free
                        </button>
                    </div>
                </section>
            </div>
            <Footer />
        </>
    );
}
