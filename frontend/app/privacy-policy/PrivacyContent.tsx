'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, Lock, Eye, FileText, ChevronRight } from 'lucide-react'
import Navbar from '../../components/Navbar'
import AuthenticatedNavbar from '../../components/AuthenticatedNavbar'
import { useAuth } from '../../contexts/AuthContext'
import Footer from '../../components/Footer'

export default function PrivacyPolicy() {
    const { isAuthenticated, isLoading } = useAuth()
    const lastUpdated = 'February 1, 2026'

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Navigation */}
            {isAuthenticated ? (
                <AuthenticatedNavbar isLoading={isLoading} />
            ) : (
                <Navbar isAuthenticated={false} onSignIn={() => { }} onSignUp={() => { }} />
            )}

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none"></div>

                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm mb-6 animate-fade-in">
                        <Shield className="w-4 h-4" />
                        Legal Documentation
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                        Privacy <span className="text-blue-600">Policy</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto mb-8">
                        At Reword, we prioritize your data security and privacy. This policy explains how we collect, use, and protect your information.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-slate-500 font-bold uppercase tracking-widest">
                        <span>Last Updated:</span>
                        <span className="text-slate-900 dark:text-white">{lastUpdated}</span>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="pb-24">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden">
                        <div className="p-8 lg:p-12 space-y-12">

                            {/* Introduction */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">1</div>
                                    Introduction
                                </h2>
                                <div className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium space-y-4">
                                    <p>
                                        Reword ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from reword.entrext.com (the "Site") or use our AI content repurposing services (the "Services").
                                    </p>
                                    <p>
                                        By using Reword, you agree to the collection and use of information in accordance with this policy. We will not use or share your information with anyone except as described in this Privacy Policy.
                                    </p>
                                </div>
                            </div>

                            {/* Data We Collect */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">2</div>
                                    Information We Collect
                                </h2>
                                <div className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium space-y-4">
                                    <p>
                                        We collect several types of information to provide and improve our Services to you:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2 marker:text-blue-500">
                                        <li><strong className="text-slate-900 dark:text-white">Account Information:</strong> When you register, we collect your name, email address, and authentication data (including Google OAuth data if used).</li>
                                        <li><strong className="text-slate-900 dark:text-white">Usage Data:</strong> We collect information on how the Service is accessed and used, including your IP address, browser type, and interaction with the platform.</li>
                                        <li><strong className="text-slate-900 dark:text-white">Content Data:</strong> We process the text and URLs you provide for repurposing. This content is processed via AI models (like GPT-4o) to generate your social media posts.</li>
                                        <li><strong className="text-slate-900 dark:text-white">Payment Data:</strong> Payment processing is handled by Dodo Payments. We do not store your credit card details on our servers.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* How We Use Your Data */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">3</div>
                                    How We Use Information
                                </h2>
                                <div className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium space-y-4">
                                    <p>Reword uses the collected data for various purposes:</p>
                                    <ul className="list-disc pl-6 space-y-2 marker:text-blue-500">
                                        <li>To provide and maintain our Service</li>
                                        <li>To notify you about changes to our Service</li>
                                        <li>To provide customer support</li>
                                        <li>To gather analysis or valuable information so that we can improve our Service</li>
                                        <li>To monitor the usage of our Service</li>
                                        <li>To detect, prevent and address technical issues</li>
                                    </ul>
                                </div>
                            </div>

                            {/* AI Processing */}
                            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-blue-600" />
                                    AI Content Safety
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    Your content is processed by enterprise-grade AI models. We do not use your private content to "train" public AI models. Your inputs remain your intellectual property.
                                </p>
                            </div>

                            {/* Data Sharing */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-600">4</div>
                                    Data Sharing & Disclosure
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                    We do not sell your personal data. We only share information with third-party service providers necessary to operate our service, such as:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 marker:text-blue-500 text-slate-600 dark:text-slate-400 font-medium">
                                    <li><strong className="text-slate-900 dark:text-white">AI Providers:</strong> OpenAI and Pollinations (for content generation)</li>
                                    <li><strong className="text-slate-900 dark:text-white">Analytics:</strong> Google Analytics (to understand usage patterns)</li>
                                    <li><strong className="text-slate-900 dark:text-white">Payments:</strong> Dodo Payments (for subscription management)</li>
                                </ul>
                            </div>

                            {/* Contact Us */}
                            <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Have questions?</h3>
                                        <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Our legal team is here to help you understand your rights.</p>
                                    </div>
                                    <a href="mailto:business@entrext.in" className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all">
                                        Contact Legal Team
                                    </a>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-bold transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
