'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, ArrowLeft, Scale, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import Navbar from '../../components/Navbar'
import AuthenticatedNavbar from '../../components/AuthenticatedNavbar'
import { useAuth } from '../../contexts/AuthContext'
import Footer from '../../components/Footer'

export default function TermsOfService() {
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
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>

                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-6 animate-fade-in">
                        <Scale className="w-4 h-4" />
                        Terms of Service
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                        Terms of <span className="text-indigo-600">Service</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto mb-8">
                        Please read these terms carefully before using Reword AI. By using our platform, you agree to these legally binding terms.
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

                            {/* Acceptance */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">1</div>
                                    Agreement to Terms
                                </h2>
                                <div className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium space-y-4">
                                    <p>
                                        By accessing or using Reword (reword.entrext.com), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                                    </p>
                                    <p>
                                        The materials contained in this website are protected by applicable copyright and trademark law.
                                    </p>
                                </div>
                            </div>

                            {/* Use License */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">2</div>
                                    Use License & Service Use
                                </h2>
                                <div className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium space-y-4">
                                    <p>
                                        Permission is granted to temporarily use the services provided by Reword for personal or commercial content creation. This is the grant of a license, not a transfer of title, and under this license, you may not:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2 marker:text-indigo-500">
                                        <li>Use the Service for any illegal or unauthorized purpose.</li>
                                        <li>Attempt to decompile or reverse engineer any software contained on Reword's website.</li>
                                        <li>Use the Service to generate deepfakes, hate speech, or misinformation.</li>
                                        <li>Use automated scripts or "bots" to scrape the Service without explicit permission.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Content Ownership */}
                            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                                    Your Content, Your Rights
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    You retain full ownership and copyright of any content you upload and any content generated by Reword based on your inputs. Reword does not claim any ownership over your repurposed social media posts.
                                </p>
                            </div>

                            {/* Subscriptions & Refunds */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">3</div>
                                    Subscriptions & Payments
                                </h2>
                                <div className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium space-y-4">
                                    <p>
                                        Reword offers both free and paid subscription plans (Pro). Payments are handled by Dodo Payments.
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2 marker:text-indigo-500">
                                        <li><strong className="text-slate-900 dark:text-white">Billing:</strong> You will be billed in advance on a recurring and periodic basis.</li>
                                        <li><strong className="text-slate-900 dark:text-white">Cancellations:</strong> You can cancel your subscription at any time through your dashboard.</li>
                                        <li><strong className="text-slate-900 dark:text-white">Refunds:</strong> Since our services are digital and provide immediate value, refunds are generally not provided except where required by law.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Disclaimer */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">4</div>
                                    Disclaimer & Limitations
                                </h2>
                                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4">
                                    <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                        The services on Reword's website are provided on an 'as is' basis. Reword makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                                    </p>
                                </div>
                            </div>

                            {/* Governing Law */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-600 dark:text-slate-400">5</div>
                                    Governing Law
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                    These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                                </p>
                            </div>

                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-bold transition-colors">
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
