'use client'

import { useState } from 'react'
import { Sparkles, Heart, ChevronDown, Mail, Github, Twitter, Linkedin } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>(null)

  const toggleSection = (title: string) => {
    setOpenSection(openSection === title ? null : title)
  }

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) {
      toast.error('Please enter your email address')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newsletterEmail)) {
      toast.error('Please enter a valid email address')
      return
    }
    setIsSubscribing(true)
    try {
      const encodedEmail = encodeURIComponent(newsletterEmail)
      const substackUrl = `https://entrextlabs.substack.com/subscribe?email=${encodedEmail}`
      toast.success('🎉 Redirecting to subscribe page...')
      setTimeout(() => {
        window.open(substackUrl, '_blank')
        setNewsletterEmail('')
      }, 1000)
    } catch (error) {
      toast.error('Failed to redirect. Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  interface FooterLink {
    name: string;
    href: string;
    external: boolean;
  }

  const sections: { title: string; links: FooterLink[] }[] = [
    {
      title: 'Platform',
      links: [
        { name: 'Pricing', href: '/pricing', external: false },
        { name: 'Features', href: '/features', external: false },
        { name: 'AI Updates', href: '/updates', external: false },
        { name: 'Blog', href: '/blog', external: false },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: 'https://www.entrext.com/', external: true },
        { name: 'Careers', href: 'https://deformity.ai/d/C-P5znqtG_ZZ', external: true },
        { name: 'Contact', href: 'mailto:business@entrext.in?subject=Reword Contact', external: true },
        { name: 'Support', href: '#', external: false },
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/privacy-policy', external: false },
        { name: 'Terms of Service', href: '/terms-of-service', external: false },
        { name: 'Cookie Policy', href: '/cookie-policy', external: false },
      ]
    }
  ]

  return (
    <footer className="footer-gradient border-t border-slate-200 dark:border-slate-800/50 mt-20 relative overflow-hidden" aria-label="Site Footer">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* Brand Info & Socials */}
          <div className="lg:col-span-5 space-y-8">
            <div className="flex flex-col space-y-6">
              <Link href="/" className="flex items-center group w-fit">
                <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 transform transition-transform group-hover:rotate-6">
                  <Image src="/logo.png" alt="Reword Logo" width={32} height={32} unoptimized />
                </div>
                <span className="ml-3 text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Reword
                </span>
              </Link>
              <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed max-w-sm">
                The AI-powered engine for content creators to scale their reach across X, LinkedIn, and Instagram instantly. Turn one idea into a weeks worth of content.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="p-2.5 bg-slate-100 dark:bg-slate-800/50 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 rounded-xl transition-all duration-300">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="p-2.5 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700 rounded-xl transition-all duration-300">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="p-2.5 bg-slate-100 dark:bg-slate-800/50 hover:bg-blue-700 hover:text-white dark:hover:bg-blue-700 rounded-xl transition-all duration-300">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Premium Newsletter Section */}
            <div className="p-6 md:p-8 bg-white/50 dark:bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] border border-slate-200 dark:border-slate-700/50 shadow-2xl shadow-blue-500/5">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-blue-500" />
                Newsletter
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
                Get early access to weekly AI templates & content tips.
              </p>
              <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="name@email.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
                  disabled={isSubscribing}
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all whitespace-nowrap"
                >
                  {isSubscribing ? '...' : 'Join Free'}
                </button>
              </form>
              <p className="mt-4 text-[11px] text-slate-400 font-medium flex items-center gap-1.5 opacity-80">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Trusted by 500+ creators and marketers worldwide.
              </p>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {sections.map((section) => (
              <div key={section.title} className="space-y-6">
                <div
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between cursor-pointer md:cursor-default"
                >
                  <h3 className="text-slate-950 dark:text-white font-black text-sm uppercase tracking-widest relative">
                    {section.title}
                    <span className="absolute -bottom-1 left-0 w-8 h-1 bg-blue-500 rounded-full"></span>
                  </h3>
                  <ChevronDown className={`w-5 h-5 text-slate-400 md:hidden transition-transform duration-300 ${openSection === section.title ? 'rotate-180 text-blue-500' : ''}`} />
                </div>

                {/* Shared Container for Mobile & Desktop */}
                <div className={`${openSection === section.title ? 'block' : 'hidden'} md:block`}>
                  <ul className="flex flex-col space-y-5">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        {link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 text-base font-semibold inline-flex items-center group/link"
                          >
                            <span className="relative">
                              {link.name}
                              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover/link:w-full"></span>
                            </span>
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 text-base font-semibold inline-flex items-center group/link"
                          >
                            <span className="relative">
                              {link.name}
                              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover/link:w-full"></span>
                            </span>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Improved Bottom Section */}
        <div className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-sm">
            <div className="order-2 md:order-1 flex flex-col items-center md:items-start gap-2">
              <p className="text-slate-500 dark:text-slate-400 font-bold">
                © 2026 Reword. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 font-medium">
                <Link href="#" className="hover:text-blue-500 transition-colors">Privacy</Link>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                <Link href="#" className="hover:text-blue-500 transition-colors">Terms</Link>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                <Link href="#" className="hover:text-blue-500 transition-colors">Cookies</Link>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="group flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 shadow-sm cursor-default">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
                  Built with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse group-hover:scale-125 transition-transform" /> by
                  <a href="https://entrext.in" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 font-black hover:text-indigo-500 transition-colors ml-1">
                    Entrext Labs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-gradient {
          background: radial-gradient(circle at 50% -20%, rgba(59, 130, 246, 0.05), transparent 40%),
                      var(--footer-bg);
        }
        :global(.dark) .footer-gradient {
          --footer-bg: #020617;
        }
        :global(:not(.dark)) .footer-gradient {
          --footer-bg: #f8fafc;
        }
      `}</style>
    </footer>
  )
}