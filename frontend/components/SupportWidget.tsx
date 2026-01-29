'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, ChevronRight, HelpCircle, ChevronDown, ChevronUp, Search, Home } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { useAuth } from '../contexts/AuthContext'
import { API_URL } from '@/lib/api-config'
import { supportClient } from '../lib/support/client'

interface FAQ {
  question: string
  answer: string
  category?: string
}

const SupportWidget = () => {
  const { user, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'faq'>('home')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<"feedback" | "bug" | "feature" | "support">('support')
  const [isSending, setIsSending] = useState(false)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Pre-fill email when user is authenticated
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user])

  // Common FAQs
  const faqs: FAQ[] = [
    {
      question: "How does the credit system work?",
      answer: "Free users get 2 generations per day. Pro users get 20 generations per day. Credits reset every 24 hours.",
      category: "Billing"
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel anytime from your dashboard settings. You'll keep access until the end of your billing period.",
      category: "Billing"
    },
    {
      question: "Do you support video content?",
      answer: "Currently we support text and URL-based content transformation for social media. Video support is on our roadmap.",
      category: "Features"
    },
    {
      question: "How do I export my content?",
      answer: "Pro users can export content to various formats (TXT, JSON, CSV) from the dashboard or directly after generation.",
      category: "Features"
    },
    {
      question: "Is my data secure?",
      answer: "We use enterprise-grade encryption and do not store your original content permanently unless you explicitly save it.",
      category: "Security"
    }
  ]

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !message.trim()) {
      toast.error('Please fill in both fields')
      return
    }

    setIsSending(true)

    try {
      await supportClient.submitTicket({
        product: "Reword", // Micro-saas name
        category: category,
        user_email: email,
        message: message,
        metadata: {
          page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          isAuthenticated: isAuthenticated,
          username: user?.username || 'Guest'
        }
      })

      toast.success('Message sent! We\'ll get back to you shortly.')
      setMessage('')
      setIsOpen(false)
    } catch (error) {
      console.error('Support submission error:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  // Helper to render the footer tab button
  const TabButton = ({ tab, icon: Icon, label }: { tab: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`relative flex flex-col items-center justify-center gap-1 transition-all h-full flex-1 ${activeTab === tab
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
    >
      <Icon className={`w-6 h-6 transition-all ${activeTab === tab ? 'scale-110 drop-shadow-sm' : 'scale-100'}`} strokeWidth={activeTab === tab ? 2.5 : 2} />
      <span className={`text-[10px] font-medium tracking-wide ${activeTab === tab ? 'font-bold' : ''}`}>
        {label}
      </span>
      {activeTab === tab && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute -top-3 w-12 h-1 bg-blue-500 rounded-b-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />
      )}
    </button>
  )

  // Lock body scroll when widget is open
  // Lock body scroll only on mobile when widget is open
  useEffect(() => {
    if (isOpen) {
      // Check if mobile width
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        document.body.style.overflow = 'hidden'
      }
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop for mobile only */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Widget Window Container - Decoupled */}
      <div className={`fixed z-[9999] transition-all duration-300 ${isOpen
        ? 'inset-0 flex items-center justify-center pointer-events-auto md:inset-auto md:bottom-24 md:right-6'
        : 'pointer-events-none'
        } print:hidden`}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-[calc(100vw-2rem)] sm:w-[380px] h-[600px] max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative flex-shrink-0 shadow-md z-10">
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>


                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white rounded-xl shadow-lg p-1 flex items-center justify-center w-10 h-10 transform transition-all duration-300 hover:rotate-3">
                    <Image
                      src="/logo.png"
                      alt="Reword Logo"
                      width={100}
                      height={100}
                      quality={100}
                      unoptimized
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Reword</h3>
                </div>
                <p className="text-blue-100 text-xs font-medium bg-white/10 inline-block px-2 py-0.5 rounded-full">
                  Repurpose your content for X, Linkedin and many more !
                </p>
              </div>

              {/* Content Area - Scrollable */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-28 bg-gray-50/50 dark:bg-black/20">

                {/* HOME VIEW */}
                <AnimatePresence mode="wait">
                  {activeTab === 'home' && (
                    <motion.div
                      key="home"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Hi there! 👋</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                          Welcome to Reword support. Select an option below or use the tabs to navigate.
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <button
                          onClick={() => setActiveTab('messages')}
                          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group text-left flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              <Send className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white text-sm">Send a Message</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Get help via email</div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </button>

                        <button
                          onClick={() => setActiveTab('faq')}
                          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all group text-left flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                              <HelpCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white text-sm">Knowledge Base</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Find answers instantly</div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                        </button>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/50 p-4 rounded-xl border border-blue-100 dark:border-gray-700">
                        <h5 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Pro Tip</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Did you know? You can convert existing LinkedIn posts into Twitter threads with one click.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* MESSAGE VIEW */}
                  {activeTab === 'messages' && (
                    <motion.div
                      key="messages"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                          Leave us a message, and we'll get back to you at your email address.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Email</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:ring-0 focus:border-blue-500 hover:border-gray-200 dark:hover:border-gray-600 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all dark:text-white mb-4"
                          />

                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Category</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as any)}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:ring-0 focus:border-blue-500 hover:border-gray-200 dark:hover:border-gray-600 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all dark:text-white mb-4 appearance-none cursor-pointer"
                          >
                            <option value="support">General Support</option>
                            <option value="feedback">Feedback</option>
                            <option value="bug">Bug Report</option>
                            <option value="feature">Feature Request</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Message</label>
                          <textarea
                            required
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            placeholder="How can we help?"
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:ring-0 focus:border-blue-500 hover:border-gray-200 dark:hover:border-gray-600 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all resize-none custom-scrollbar dark:text-white"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSending}
                          className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                          {isSending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Send Message</span>
                              <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {/* FAQ VIEW */}
                  {activeTab === 'faq' && (
                    <motion.div
                      key="faq"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search for answers..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:ring-0 focus:border-purple-500 outline-none transition-all dark:text-white shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        {filteredFAQs.map((faq, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-800"
                          >
                            <button
                              onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                              className="w-full p-4 flex items-start justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-3"
                            >
                              <span className="font-medium text-gray-900 dark:text-white text-sm pt-0.5">
                                {faq.question}
                              </span>
                              {expandedFAQ === index ? (
                                <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 rotate-180 transition-transform">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-transform">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </button>

                            <AnimatePresence>
                              {expandedFAQ === index && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="px-4 pb-4"
                                >
                                  <div className="pt-2 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700/50 leading-relaxed">
                                    {faq.answer}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}

                        {filteredFAQs.length === 0 && (
                          <div className="text-center py-10 opacity-60">
                            <Search className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500 text-sm">No answers found.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Tab Bar (Fixed) */}
              <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-2 pb-safe-area shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] z-20 h-[70px]">
                <TabButton tab="home" icon={Home} label="Home" />
                <TabButton tab="messages" icon={Send} label="Messages" />
                <TabButton tab="faq" icon={HelpCircle} label="Help" />
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Toggle Button Container - Separated to prevent layout shifts */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9990] print:hidden">
        <motion.button
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-full shadow-xl shadow-blue-600/20 flex items-center justify-center transition-all duration-300 ${isOpen
            ? 'hidden md:flex bg-gray-900 dark:bg-gray-800 text-white rotate-90 scale-90'
            : 'flex bg-gradient-to-tr from-blue-600 to-purple-600 text-white hover:shadow-blue-500/40'
            }`}
        >
          {isOpen ? (
            <ChevronDown className="w-8 h-8" />
          ) : (
            <MessageCircle className="w-8 h-8" />
          )}
        </motion.button>
      </div>
    </>
  )
}

export default SupportWidget
