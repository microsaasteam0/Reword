'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts, BlogPost } from '@/lib/blog-data';
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
                {/* Hero Section & Filter */}
                <section className="relative pt-16 pb-20 px-6 overflow-hidden bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent dark:from-blue-900/20 dark:via-[#0F172A] dark:to-[#0F172A] pointer-events-none"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] md:w-[1000px] h-[400px] bg-blue-400/5 dark:bg-blue-500/10 rounded-[100%] blur-3xl pointer-events-none"></div>

                    <div className="relative max-w-4xl mx-auto text-center z-10">
                        <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 bg-white dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-100 dark:border-blue-500/20 shadow-sm dark:shadow-blue-900/20 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Content Repurposing Insights
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-slate-900 dark:text-white dark:bg-gradient-to-b dark:from-white dark:to-slate-400 dark:bg-clip-text dark:text-transparent tracking-tight leading-[1.1] drop-shadow-sm">
                            Reword Blog
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 font-light">
                            Master the art of content repurposing with proven strategies, real examples, and actionable insights to multiply your reach across platforms.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-slate-600 dark:text-slate-400 text-sm font-medium mb-12 bg-white/70 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/50 inline-flex backdrop-blur-sm shadow-sm dark:shadow-none">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                24 In-Depth Articles
                            </div>
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-500/10 text-pink-500 dark:text-pink-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                ~6 min read average
                            </div>
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                Actionable Strategies
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5 justify-center">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${selectedCategory === category
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-1 ring-blue-500 transform scale-105'
                                        : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
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
                                unoptimized
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
