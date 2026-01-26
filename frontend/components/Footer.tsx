'use client'

import { useState } from 'react'
import { Sparkles, Heart, ChevronDown } from 'lucide-react'
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
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy', href: '/privacy-policy', external: false },
        { name: 'Terms', href: '/terms-of-service', external: false },
        { name: 'Cookies', href: '/cookie-policy', external: false },
      ]
    }
  ]

  return (
    <footer className="bg-gray-100 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 mt-16" aria-label="Site Footer">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row justify-between gap-8 lg:gap-12">

          {/* Brand & Newsletter Section */}
          <div className="lg:w-1/3 space-y-6 md:space-y-8">
            <div itemScope itemType="https://schema.org/Organization">
              <div className="flex items-center mb-4">
                <div className="bg-white rounded-xl shadow-lg p-1 mr-3 flex items-center justify-center w-10 h-10 transform transition-all hover:rotate-3">
                  <Image src="/logo.png" alt="Reword Logo" width={40} height={40} unoptimized itemProp="logo" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Reword</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed" itemProp="description">
                The AI-powered engine for content creators to scale their reach across X, LinkedIn, and Instagram instantly.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Newsletter
              </h4>
              <form onSubmit={handleNewsletterSubscribe} className="flex flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                  disabled={isSubscribing}
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all whitespace-nowrap"
                >
                  {isSubscribing ? '...' : 'Join Free'}
                </button>
              </form>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">
                Join 500+ creators scaling their content. No spam, unsubscribe anytime.
              </p>
            </div>
          </div>

          {/* Links Sections - Accordion on Mobile, Grid on Desktop */}
          <div className="lg:w-1/2 flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-8">
            {sections.map((section) => (
              <div key={section.title} className="border-b md:border-none border-gray-200 dark:border-gray-800 pb-4 md:pb-0 last:border-0 last:pb-0">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between md:cursor-default group"
                >
                  <h3 className="text-gray-900 dark:text-white font-bold text-sm uppercase tracking-widest">{section.title}</h3>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 md:hidden ${openSection === section.title ? 'rotate-180 text-blue-500' : ''}`} />
                </button>

                {/* Mobile Accordion Content */}
                <AnimatePresence initial={false}>
                  {(openSection === section.title || typeof window !== 'undefined' && window.innerWidth >= 768) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="md:!h-auto md:!opacity-100 overflow-hidden"
                    >
                      <ul className="space-y-3 pt-4 md:pt-4">
                        {section.links.map((link) => (
                          <li key={link.name}>
                            {link.external ? (
                              <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors text-sm font-medium flex items-center gap-1 group/link">
                                {link.name}
                              </a>
                            ) : (
                              <Link href={link.href} className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors text-sm font-medium block">
                                {link.name}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Desktop Content (Force render if needed or rely on above conditional) */}
                {/* Actually calling window.innerWidth in render might cause hydration mismatch. 
                    Better strategy: CSS Display. 
                    - Mobile: Accordion (controlled by state).
                    - Desktop: Always visible (hidden on mobile? No, shared content).
                    
                    Fix: Render the list always on MD+. On Mobile, use the motion div.
                */}
                <div className="hidden md:block">
                  <ul className="space-y-3 pt-4">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        {link.external ? (
                          <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors text-sm font-medium">
                            {link.name}
                          </a>
                        ) : (
                          <Link href={link.href} className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors text-sm font-medium">
                            {link.name}
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

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-6 text-[12px]">
          <div className="text-gray-500 font-medium text-center sm:text-left">
            © 2026 Reword. All rights reserved.
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-gray-500 font-medium bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
              Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" /> by
              <a href="https://entrext.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Entrext Labs</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}