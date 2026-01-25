'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts, BlogPost } from '@/lib/blogData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedNavbar from '@/components/AuthenticatedNavbar';

export default function BlogPage() {
    const { isAuthenticated } = useAuth();
    const allPosts = getAllPosts();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = ['All', ...Array.from(new Set(allPosts.map(post => post.category)))];

    const filteredPosts = selectedCategory === 'All'
        ? allPosts
        : allPosts.filter(post => post.category === selectedCategory);

    return (
        <>
            {isAuthenticated ? (
                <AuthenticatedNavbar activeTab="blog" />
            ) : (
                <Navbar showAuthButtons={true} />
            )}
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                {/* Hero Section */}
                <section className="pt-8 pb-16 px-6">
                    <div className="max-w-6xl mx-auto text-center">
                        <div className="inline-block mb-4 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium">
                            📚 Content Repurposing Insights
                        </div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                            Reword Blog
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            Master the art of content repurposing with proven strategies, real examples, and actionable insights to multiply your reach across platforms
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                24 In-Depth Articles
                            </span>
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ~6 min read average
                            </span>
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Actionable Strategies
                            </span>
                        </div>
                    </div>
                </section>

                {/* Category Filter */}
                <section className="px-6 pb-12">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-wrap gap-3 justify-center">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-6 py-2 rounded-full font-medium transition-all ${selectedCategory === category
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Blog Posts Grid */}
                <section className="px-6 pb-20">
                    <div className="max-w-6xl mx-auto">
                        {filteredPosts.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-500 dark:text-gray-400 text-lg">
                                    No posts found in this category.
                                </p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredPosts.map((post) => (
                                    <BlogCard key={post.id} post={post} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
            <Footer />
        </>
    );
}

function BlogCard({ post }: { post: BlogPost }) {
    return (
        <Link href={`/blog/${post.slug}`}>
            <article className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
                {/* Image */}
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                    {post.image && (
                        <>
                            <Image
                                src={post.image}
                                alt={post.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                        </>
                    )}
                    {post.featured && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                            ⭐ Featured
                        </div>
                    )}
                    {/* Category Badge on Image */}
                    <div className="absolute bottom-4 left-4">
                        <span className="px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold shadow-lg">
                            {post.category}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Read Time */}
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {post.readTime}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300 line-clamp-2 leading-tight">
                        {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                    </p>

                    {/* Author & Date */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                            {post.author.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {post.author.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                        {/* Read More Arrow */}
                        <div className="text-blue-600 dark:text-blue-400 group-hover:translate-x-2 transition-transform duration-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {post.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="text-xs px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium border border-blue-100 dark:border-blue-800"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </article>
        </Link>
    );
}
