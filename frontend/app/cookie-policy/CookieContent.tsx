'use client'

import React from 'react'
import Link from 'next/link'
import { Cookie, ArrowLeft, Info, Settings, Database, ChevronRight } from 'lucide-react'
import Navbar from '../../components/Navbar'
import AuthenticatedNavbar from '../../components/AuthenticatedNavbar'
import { useAuth } from '../../contexts/AuthContext'
import Footer from '../../components/Footer'

export default function CookiePolicy() {
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
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none"></div>

                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm mb-6 animate-fade-in">
                        <Cookie className="w-4 h-4" />
                        Cookie Policy
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                        Cookie <span className="text-amber-600">Policy</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto mb-8">
                        Learn how we use cookies and similar technologies to improve your experience on Reword.
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
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">1</div>
                                    What are Cookies?
                                </h2>
                                <div className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                    <p>
                                        Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
                                    </p>
                                </div>
                            </div>

                            {/* Types of Cookies */}
                            <div className="space-y-8">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">2</div>
                                    Types of Cookies We Use
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Necessary */}
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                            <Settings className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Essential Cookies</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Necessary for the platform to function correctly, such as authentication and security layers.</p>
                                    </div>

                                    {/* Performance */}
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-600 mb-4">
                                            <Database className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Performance Cookies</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Help us understand how visitors interact with the site by collecting and reporting information anonymously.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Third Party Cookies */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">3</div>
                                    Third-Party Cookies
                                </h2>
                                <div className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium space-y-4">
                                    <p>
                                        In some special cases, we also use cookies provided by trusted third parties. The following section details which third party cookies you might encounter through this site:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-3 marker:text-amber-500">
                                        <li><strong className="text-slate-900 dark:text-white">Google Analytics:</strong> To track and measure usage of this site so that we can continue to produce engaging content.</li>
                                        <li><strong className="text-slate-900 dark:text-white">Dodo Payments:</strong> To manage your subscription status and ensure secure transaction processing.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Managing Cookies */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">4</div>
                                    Managing Cookies
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                    You can prevent the setting of cookies by adjusting the settings on your browser. Be aware that disabling cookies will affect the functionality of this and many other websites that you visit. Disabling cookies will usually result in also disabling certain functionality and features of this site.
                                </p>
                                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
                                    <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                        We recommend that you leave on all cookies if you are not sure whether you need them or not in case they are used to provide a service that you use.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 font-bold transition-colors">
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
