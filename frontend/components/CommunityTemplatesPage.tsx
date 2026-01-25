'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Search, Globe, TrendingUp, Calendar, Eye, Copy, FileText, Crown, Lock, Users, Grid, List, RefreshCw } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { requestCache } from '../lib/requestCache'

interface CommunityTemplate {
  id: number
  name: string
  description?: string
  category: string
  content: string
  tags?: string
  is_public: boolean
  usage_count: number
  is_favorite: boolean
  created_at: string
  updated_at?: string
  user_id: number
  is_own_template: boolean
}

interface CommunityTemplatesPageProps {
  onBack: () => void
  onTemplateSelect?: (template: CommunityTemplate) => void
  onUpgradeClick?: () => void
}

const CommunityTemplatesPage: React.FC<CommunityTemplatesPageProps> = ({
  onBack,
  onTemplateSelect,
  onUpgradeClick
}) => {
  const { user, isAuthenticated } = useAuth()
  const [templates, setTemplates] = useState<CommunityTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)

  const categories = [
    { value: 'all', label: 'All Categories', icon: '🌐' },
    { value: 'blog', label: 'Blog Posts', icon: '📝' },
    { value: 'newsletter', label: 'Newsletters', icon: '📧' },
    { value: 'marketing', label: 'Marketing', icon: '🎯' },
    { value: 'social', label: 'Social Media', icon: '📱' },
    { value: 'other', label: 'Other', icon: '📋' }
  ]

  useEffect(() => {
    console.log('CommunityTemplatesPage useEffect:', {
      isAuthenticated,
      user: !!user,
      hasAuthToken: !!axios.defaults.headers.common['Authorization']
    })

    // Check if we have any cached data first to show immediately
    const cacheKey = `community-templates-${selectedCategory}-${sortBy}`

    // Try to get cached data immediately for instant display
    const cachedData = requestCache.getCached<CommunityTemplate[]>(cacheKey)

    if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
      console.log('📦 Showing cached data immediately')
      setTemplates(cachedData)
      setIsFromCache(true)
      setIsLoading(false)
    } else {
      // No cached data, start loading immediately
      console.log('🔄 No cached data, loading fresh templates')
      setIsLoading(true)
      setIsFromCache(false)
    }

    // Load templates for browsing (no auth required)
    // Small delay to ensure component is mounted
    setTimeout(() => {
      loadCommunityTemplates()
    }, 100)
  }, [selectedCategory, sortBy])

  const loadCommunityTemplates = async () => {
    try {
      // Don't set loading if we already have cached data showing
      if (!isFromCache) {
        setIsLoading(true)
      }

      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      // Create cache key based on category and sort
      const cacheKey = `community-templates-${selectedCategory}-${sortBy}`

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/templates?${params.toString()}`
      console.log('🔄 Loading community templates from API:', url)

      const response = await requestCache.get(
        cacheKey,
        async () => {
          console.log('🔄 CommunityTemplatesPage: Making fresh public/templates API call')
          const res = await axios.get(url)
          return res.data
        },
        5 * 60 * 1000 // 5 minute cache
      )

      let sortedTemplates = response

      // Sort templates based on selected criteria
      if (sortBy === 'popular') {
        sortedTemplates.sort((a: CommunityTemplate, b: CommunityTemplate) => b.usage_count - a.usage_count)
      } else {
        sortedTemplates.sort((a: CommunityTemplate, b: CommunityTemplate) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }

      setTemplates(sortedTemplates)
      setIsFromCache(false)

      console.log('✅ Loaded community templates:', sortedTemplates.length)
    } catch (error: any) {
      console.error('Error loading community templates:', error)
      console.error('Error response:', error.response)

      if (error.response?.status === 401) {
        toast.error('Please sign in again to access community templates')
      } else if (error.response?.status === 422) {
        console.error('422 Error details:', error.response.data)
        toast.error('Authentication error. Please refresh and try again.')
      } else {
        toast.error('Failed to load community templates')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateUse = async (template: CommunityTemplate) => {
    // Check if user has Pro access
    if (!user?.is_premium) {
      // For free users, redirect to upgrade instead of showing error
      if (onUpgradeClick) {
        onUpgradeClick()
      }
      return
    }

    try {
      // Increment usage count
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/${template.id}/use`)

      // Update local state
      setTemplates(prev => prev.map(t =>
        t.id === template.id
          ? { ...t, usage_count: t.usage_count + 1 }
          : t
      ))

      // Invalidate cache since usage count changed
      const cacheKey = `community-templates-${selectedCategory}-${sortBy}`
      requestCache.invalidate(cacheKey)

      if (onTemplateSelect) {
        onTemplateSelect(template)
      }

      toast.success(`Template "${template.name}" loaded!`)
      onBack() // Go back to main page after selecting template
    } catch (error: any) {
      console.error('Error using template:', error)
      toast.error('Failed to use template')
    }
  }

  // Function to manually refresh templates (clear cache and reload)
  const refreshTemplates = async () => {
    // Clear cache for this specific key
    const cacheKey = `community-templates-${selectedCategory}-${sortBy}`
    requestCache.invalidate(cacheKey)

    // Reload templates
    setIsFromCache(false)
    await loadCommunityTemplates()
    toast.success('Templates refreshed!')
  }

  const handleCopyContent = async (content: string, templateName: string, e: React.MouseEvent) => {
    e.stopPropagation()

    // Check if user has Pro access
    if (!user?.is_premium) {
      // For free users, redirect to upgrade instead of showing error
      if (onUpgradeClick) {
        onUpgradeClick()
      }
      return
    }

    try {
      await navigator.clipboard.writeText(content)
      toast.success(`"${templateName}" content copied to clipboard!`)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = content
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success(`"${templateName}" content copied to clipboard!`)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.value === category)
    return categoryData?.icon || '📄'
  }

  const TemplateCard = ({ template }: { template: CommunityTemplate }) => (
    <div
      className={`relative bg-gradient-to-br dark:from-gray-800/80 dark:to-gray-900/80 from-white to-gray-50 border dark:border-gray-700/50 border-gray-200 shadow-sm dark:shadow-none rounded-xl p-6 dark:hover:border-gray-600/50 hover:border-gray-300 hover:shadow-md transition-all duration-300 group cursor-pointer overflow-hidden ${!user?.is_premium ? 'hover:scale-[1.02]' : 'hover:scale-[1.02]'
        }`}
      onClick={() => handleTemplateUse(template)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50"></div>

      {/* Pro Lock Overlay for Free Users */}
      {!user?.is_premium && (
        <div className="absolute inset-0 dark:bg-gray-900/90 bg-white/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="dark:text-white text-gray-900 font-bold text-lg mb-2">Pro Feature</h3>
            <p className="dark:text-gray-300 text-gray-600 text-sm mb-4 max-w-xs">
              Unlock this template and thousands more with Pro
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onUpgradeClick) {
                  onUpgradeClick()
                } else {
                  onBack() // Fallback to going back
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold rounded-lg text-sm transition-all duration-200 transform hover:scale-105"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}

      {/* Template Header */}
      <div className="relative z-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mr-3 border border-green-500/30 shadow-lg flex-shrink-0">
              <span className="text-lg">{getCategoryIcon(template.category)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="dark:text-white text-gray-900 font-bold text-base group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors truncate mb-1 leading-tight">
                {template.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs dark:text-gray-400 text-gray-600 capitalize dark:bg-gray-700/50 bg-gray-100 px-2 py-1 rounded-full border dark:border-transparent border-gray-200">
                  {template.category}
                </span>
                <span className="text-xs bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-500 dark:text-green-400 px-2 py-1 rounded-full border border-green-500/30 flex items-center">
                  <Globe className="w-3 h-3 mr-1" />
                  Community
                </span>
              </div>
            </div>
          </div>

          {user?.is_premium && (
            <button
              onClick={(e) => handleCopyContent(template.content, template.name, e)}
              className="p-2 text-gray-500 dark:hover:text-white hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100 dark:bg-gray-800/50 bg-gray-100 rounded-lg"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Description */}
        {template.description && (
          <p className="dark:text-gray-300 text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        )}

        {/* Tags */}
        {template.tags && (
          <div className="flex flex-wrap gap-2 mb-4">
            {template.tags.split(',').slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gradient-to-r dark:from-gray-700/50 dark:to-gray-800/50 from-gray-100 to-gray-200 dark:text-gray-300 text-gray-600 text-xs rounded-full border dark:border-gray-600/50 border-gray-200"
              >
                {tag.trim()}
              </span>
            ))}
            {template.tags.split(',').length > 3 && (
              <span className="px-3 py-1 bg-gradient-to-r dark:from-gray-700/50 dark:to-gray-800/50 from-gray-100 to-gray-200 dark:text-gray-300 text-gray-600 text-xs rounded-full border dark:border-gray-600/50 border-gray-200">
                +{template.tags.split(',').length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs dark:text-gray-400 text-gray-500 mb-4 dark:bg-gray-800/30 bg-gray-50 rounded-lg p-3 border dark:border-transparent border-gray-100">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-green-500 dark:text-green-400" />
            <span className="font-medium">{template.usage_count} uses</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-500 dark:text-blue-400" />
            <span>{formatDate(template.created_at)}</span>
          </div>
        </div>

        {/* Content Preview */}
        {user?.is_premium && (
          <div className="mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpandedTemplate(expandedTemplate === template.id ? null : template.id)
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm flex items-center transition-colors dark:bg-gray-800/50 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700/50 px-3 py-2 rounded-lg"
            >
              <Eye className="w-4 h-4 mr-2" />
              {expandedTemplate === template.id ? 'Hide' : 'Preview'} Content
            </button>

            {expandedTemplate === template.id && (
              <div className="mt-3 p-4 dark:bg-gray-900/70 bg-gray-900/90 rounded-lg border border-gray-700/50 backdrop-blur-sm">
                <pre className="text-gray-300 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
                  {template.content.substring(0, 400)}
                  {template.content.length > 400 && '...'}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-center">
          {user?.is_premium ? (
            <div className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white text-sm rounded-lg font-semibold transition-all duration-200 flex items-center justify-center shadow-lg">
              <FileText className="w-4 h-4 mr-2" />
              Use Template
            </div>
          ) : (
            <div className="w-full px-4 py-3 bg-gradient-to-r dark:from-gray-600/50 dark:to-gray-700/50 from-gray-200 to-gray-300 dark:text-gray-400 text-gray-500 text-sm rounded-lg font-semibold flex items-center justify-center cursor-not-allowed border dark:border-gray-600/30 border-gray-300/50">
              <Lock className="w-4 h-4 mr-2" />
              Pro Required
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-400">Please sign in to access community templates.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 transition-colors duration-300">
      {/* Header */}
      <div className="border-b dark:border-gray-700/50 border-gray-200/50 dark:bg-gray-900/80 bg-white/80 backdrop-blur-sm relative z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="p-2 dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900 transition-colors mr-4 dark:bg-gray-800/50 bg-gray-100/50 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r dark:from-white dark:to-gray-300 from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Community Templates
                  </h1>
                  <p className="dark:text-gray-400 text-gray-600 text-sm mt-1">Discover high-quality templates created by our community</p>
                </div>
              </div>
            </div>

            {!user?.is_premium && (
              <button
                onClick={() => onUpgradeClick?.()}
                className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full font-bold text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <Crown className="w-4 h-4 fill-white/20" />
                <span>Unlock Templates</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="dark:bg-gray-800/50 bg-white border dark:border-gray-700/50 border-gray-200 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col gap-6">
            {/* Search */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 dark:text-gray-400 text-gray-500" />
              <input
                type="text"
                placeholder="Search community templates by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 dark:bg-gray-800/50 bg-gray-50 border dark:border-gray-600/50 border-gray-200 rounded-xl dark:text-white text-gray-900 dark:placeholder-gray-400 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Category Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 dark:bg-gray-800/50 bg-gray-50 border dark:border-gray-600/50 border-gray-200 rounded-xl dark:text-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value} className="dark:bg-gray-800 bg-white dark:text-white text-gray-900">
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent')}
                  className="w-full px-4 py-3 dark:bg-gray-800/50 bg-gray-50 border dark:border-gray-600/50 border-gray-200 rounded-xl dark:text-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="popular" className="dark:bg-gray-800 bg-white dark:text-white text-gray-900">🔥 Most Popular</option>
                  <option value="recent" className="dark:bg-gray-800 bg-white dark:text-white text-gray-900">🕒 Most Recent</option>
                </select>
              </div>

              {/* View Mode and Refresh */}
              <div className="flex gap-2">
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">View</label>
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="p-3 dark:bg-gray-800/50 bg-gray-50 border dark:border-gray-600/50 border-gray-200 rounded-xl dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900 transition-colors"
                  >
                    {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">Refresh</label>
                  <button
                    onClick={refreshTemplates}
                    disabled={isLoading}
                    className="p-3 dark:bg-gray-800/50 bg-gray-50 border dark:border-gray-600/50 border-gray-200 rounded-xl dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh templates from server"
                  >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="relative bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 border border-gray-200/80 dark:border-gray-700/50 rounded-xl p-6 overflow-hidden shadow-lg dark:shadow-none">
                {/* Animated shimmer effect - Enhanced for light theme */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-blue-100/60 dark:via-white/10 to-transparent"></div>

                {/* Header skeleton */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 border-2 border-blue-200/60 dark:border-blue-500/30 rounded-xl animate-pulse mr-3 shadow-sm"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300/80 dark:bg-gray-600 rounded-lg mb-2 animate-pulse shadow-sm"></div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 bg-gradient-to-r from-gray-300/80 to-gray-400/60 dark:bg-gray-700 rounded-full w-16 animate-pulse"></div>
                        <div className="h-3 bg-gradient-to-r from-green-100 to-green-200/80 dark:bg-green-500/20 border border-green-200/60 dark:border-green-500/30 rounded-full w-20 animate-pulse shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-gradient-to-r from-gray-300/80 to-gray-400/60 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>

                {/* Description skeleton */}
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gradient-to-r from-gray-200/90 to-gray-300/70 dark:bg-gray-700 rounded-lg animate-pulse shadow-sm"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200/90 to-gray-300/70 dark:bg-gray-700 rounded-lg w-4/5 animate-pulse shadow-sm"></div>
                </div>

                {/* Tags skeleton */}
                <div className="flex gap-2 mb-4">
                  <div className="h-6 bg-gradient-to-r from-gray-200/90 to-gray-300/70 dark:bg-gray-700 border border-gray-300/60 dark:border-gray-600 rounded-full w-16 animate-pulse shadow-sm"></div>
                  <div className="h-6 bg-gradient-to-r from-gray-200/90 to-gray-300/70 dark:bg-gray-700 border border-gray-300/60 dark:border-gray-600 rounded-full w-20 animate-pulse shadow-sm"></div>
                  <div className="h-6 bg-gradient-to-r from-gray-200/90 to-gray-300/70 dark:bg-gray-700 border border-gray-300/60 dark:border-gray-600 rounded-full w-12 animate-pulse shadow-sm"></div>
                </div>

                {/* Stats skeleton */}
                <div className="flex items-center justify-between text-xs mb-4 p-3 bg-gradient-to-r from-gray-50/90 to-gray-100/70 dark:bg-gray-800/30 rounded-lg border border-gray-200/60 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-300/80 to-green-400/60 dark:bg-green-400/50 rounded mr-2 animate-pulse shadow-sm"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-300/80 to-gray-400/60 dark:bg-gray-600 rounded-lg w-16 animate-pulse"></div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-300/80 to-blue-400/60 dark:bg-blue-400/50 rounded mr-2 animate-pulse shadow-sm"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-300/80 to-gray-400/60 dark:bg-gray-600 rounded-lg w-20 animate-pulse"></div>
                  </div>
                </div>

                {/* Button skeleton */}
                <div className="h-12 bg-gradient-to-r from-green-100/90 to-blue-100/80 dark:from-green-500/20 dark:to-blue-500/20 border-2 border-green-200/60 dark:border-green-500/30 rounded-xl animate-pulse shadow-lg"></div>

                {/* Floating decorations - Enhanced for light theme */}
                <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-r from-blue-300/80 to-blue-400/60 dark:bg-blue-500/30 rounded-full animate-ping shadow-sm"></div>
                <div className="absolute bottom-4 left-4 w-2 h-2 bg-gradient-to-r from-purple-300/80 to-purple-400/60 dark:bg-purple-500/30 rounded-full animate-ping delay-500 shadow-sm"></div>
                <div className="absolute top-1/2 right-6 w-1.5 h-1.5 bg-gradient-to-r from-green-300/80 to-green-400/60 dark:bg-green-500/30 rounded-full animate-ping delay-1000"></div>
              </div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {searchQuery ? 'No templates found' : 'No community templates yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? `No templates match "${searchQuery}"`
                : 'Be the first to create a public template for the community!'
              }
            </p>
          </div>
        ) : (
          <div className={`grid gap-8 ${viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            : 'grid-cols-1 max-w-4xl mx-auto'
            }`}>
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-6 text-center">
          <div className="dark:bg-gray-800/30 bg-white/50 backdrop-blur-sm border dark:border-gray-700/50 border-gray-200 rounded-xl p-6 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-center gap-4 mb-2">
              <p className="dark:text-gray-400 text-gray-600 text-lg font-medium">
                {filteredTemplates.length} community template{filteredTemplates.length !== 1 ? 's' : ''} available
              </p>
              {isFromCache && (
                <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-full border border-green-500/30 flex items-center gap-1">
                  📦 Cached
                </span>
              )}
            </div>
            {!user?.is_premium && (
              <button
                onClick={() => {
                  if (onUpgradeClick) {
                    onUpgradeClick()
                  }
                }}
                className="flex items-center justify-center mt-4 dark:hover:bg-gray-800/50 hover:bg-gray-100 rounded-xl p-2 transition-all duration-200"
              >
                <Crown className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-2" />
                <span className="dark:text-gray-300 text-gray-600 dark:hover:text-white hover:text-gray-900 transition-colors">Upgrade to Pro to unlock all community templates</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunityTemplatesPage