'use client'

import Link from 'next/link'
import { Home, ArrowLeft, HelpCircle } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[100px] animate-float" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-500/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />
            </div>

            <div className="relative z-10 text-center max-w-2xl mx-auto">
                {/* glitched 404 text effect */}
                <h1 className="text-[120px] md:text-[180px] font-display font-bold leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400 select-none animate-fade-in relative">
                    404
                    <span className="absolute top-0 left-0 w-full h-full text-primary-500/20 blur-sm animate-pulse-slow">404</span>
                </h1>

                <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-100">
                        Page Not Found
                    </h2>
                    <p className="text-lg text-slate-400 max-w-md mx-auto">
                        Oops! It seems you've ventured into the void. The page you're looking for doesn't exist or has been moved.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link
                            href="/"
                            className="group flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-full font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] transform hover:-translate-y-1"
                        >
                            <Home className="w-5 h-5" />
                            <span>Back to Home</span>
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="group flex items-center gap-2 px-8 py-3 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white rounded-full font-semibold transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span>Go Back</span>
                        </button>
                    </div>

                    <div className="pt-12 border-t border-slate-800/50 mt-12">
                        <p className="text-sm text-slate-500 mb-4">
                            Need assistance? Our support team is here to help.
                        </p>
                        <Link
                            href="mailto:support@entrext.com"
                            className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span>Contact Support</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
