'use client'

import { useState } from 'react'
import { Sparkles, Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)

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
        { name: 'About Us', href: 'https://entrext.in', external: true },
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
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row justify-between gap-12">

          {/* Brand & Newsletter Section */}
          <div className="lg:w-1/3 space-y-8">
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
              <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Newsletter</h4>
              <form onSubmit={handleNewsletterSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isSubscribing}
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {isSubscribing ? '...' : 'Join'}
                </button>
              </form>
            </div>
          </div>

          {/* Links Sections - 2 column grid on mobile */}
          <div className="lg:w-1/2 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-gray-900 dark:text-white font-bold text-sm uppercase tracking-widest mb-4">{section.title}</h3>
                <ul className="space-y-3">
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
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-[12px]">
          <div className="text-gray-500 font-medium">
            © 2026 Reword. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-500 font-medium">
              Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 transition-transform hover:scale-125" /> by
              <a href="https://entrext.in" target="_blank" rel="noopener noreferrer" className="text-blue-500 font-bold hover:underline">Entrext Labs</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}