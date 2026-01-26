'use client'

import { useState } from 'react'
import { Sparkles, Heart, ChevronDown, Mail, Instagram, Linkedin, MessageSquare, ExternalLink, Globe } from 'lucide-react'
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

  const socialLinks = [
    {
      name: 'Discord',
      href: 'https://discord.com/invite/ZZx3cBrx2',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'hover:bg-indigo-500'
    },
    {
      name: 'Entrext Labs',
      href: 'https://linktr.ee/entrext.in',
      icon: <Globe className="w-5 h-5" />,
      color: 'hover:bg-green-600'
    },
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/company/entrext/posts/?feedView=all',
      icon: <Linkedin className="w-5 h-5" />,
      color: 'hover:bg-blue-700'
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/entrext.labs/',
      icon: <Instagram className="w-5 h-5" />,
      color: 'hover:bg-pink-600'
    },
    {
      name: 'Newsletter',
      href: 'https://entrextlabs.substack.com/subscribe',
      icon: <Mail className="w-5 h-5" />,
      color: 'hover:bg-orange-500'
    }
  ]

  return (
    <footer className="footer-gradient border-t border-slate-200 dark:border-slate-800 mt-20 relative overflow-hidden" aria-label="Site Footer">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* Brand Info & Newsletter */}
          <div className="lg:col-span-5 space-y-10">
            <div className="flex flex-col space-y-6">
              <Link href="/" className="flex items-center group w-fit">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 transform transition-transform group-hover:rotate-6">
                  <Image src="/logo.png" alt="Reword Logo" width={36} height={36} unoptimized />
                </div>
                <span className="ml-4 text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Reword
                </span>
              </Link>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-sm font-medium">
                The AI-powered engine for content creators to scale their reach across X, LinkedIn, and Instagram instantly.
              </p>

              {/* New Social Links Grid */}
              <div className="flex flex-wrap items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 bg-white dark:bg-slate-800/50 hover:text-white rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 transform hover:-translate-y-1 ${social.color}`}
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter Container */}
            <div className="p-8 bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-blue-500/10"></div>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                    Weekly Creator Tips
                    <Sparkles className="w-6 h-6 text-pink-500 fill-pink-500" />
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 font-bold">Join 5,000+ creators getting AI strategies & growth hacks.</p>
                </div>
              </div>

              <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-3 relative z-10">
                <div className="flex-1 relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">@</span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-12 pr-6 py-4 text-base font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
                    disabled={isSubscribing}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-base font-black shadow-xl shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2"
                >
                  {isSubscribing ? '...' : 'Subscribe'}
                  <ChevronDown className="w-5 h-5 -rotate-90" />
                </button>
              </form>
              <p className="mt-5 text-sm text-slate-500 font-bold text-center">
                ✨ No spam, unsubscribe anytime
              </p>

              <div className="flex justify-center gap-12 mt-8 pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="text-center">
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">5K+</div>
                  <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Creators</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400">50K+</div>
                  <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Posts Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-500 dark:text-green-400">99.9%</div>
                  <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Uptime</div>
                </div>
              </div>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pt-4">
            {sections.map((section) => (
              <div key={section.title} className="space-y-6">
                <div
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between cursor-pointer md:cursor-default"
                >
                  <h3 className="text-slate-950 dark:text-white font-black text-sm uppercase tracking-widest relative">
                    {section.title}
                    <span className="absolute -bottom-2 left-0 w-8 h-1.5 bg-blue-600 rounded-full"></span>
                  </h3>
                  <ChevronDown className={`w-5 h-5 text-slate-400 md:hidden transition-transform duration-300 ${openSection === section.title ? 'rotate-180 text-blue-600' : ''}`} />
                </div>

                <div className={`${openSection === section.title ? 'block' : 'hidden'} md:block`}>
                  <ul className="flex flex-col space-y-5">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        {link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 text-base font-bold flex items-center gap-1 group"
                          >
                            {link.name}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 text-base font-bold block"
                          >
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
        <div className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-sm">
            <div className="order-2 md:order-1 flex flex-col items-center md:items-start gap-1">
              <p className="text-slate-500 dark:text-slate-400 font-bold">
                © 2026 Reword. All rights reserved.
              </p>
            </div>

            <div className="order-1 md:order-2">
              <div className="group flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 shadow-sm cursor-default">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
                  Built with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> by
                  <a href="https://entrext.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-black hover:text-blue-500 transition-colors ml-1">
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