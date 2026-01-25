'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Search, Star, Calendar, TrendingUp, Eye, Copy } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface CustomTemplate {
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
  is_own_template?: boolean
}

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onTemplateSelect: (template: CustomTemplate) => void
  defaultSource?: string // New prop to set default source filter
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onTemplateSelect,
  defaultSource = 'all'
}) => {
  const [templates, setTemplates] = useState<CustomTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSource, setSelectedSource] = useState<string>(defaultSource) // Use defaultSource prop
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null)

  const categories = [
    { value: 'all', label: 'All Templates', icon: '📄' },
    { value: 'blog', label: 'Blog Posts', icon: '📝' },
    { value: 'newsletter', label: 'Newsletters', icon: '📧' },
    { value: 'marketing', label: 'Marketing', icon: '🎯' },
    { value: 'social', label: 'Social Media', icon: '📱' },
    { value: 'other', label: 'Other', icon: '📋' }
  ]

  const sourceFilters = [
    { value: 'all', label: 'All Templates', icon: '🌐' },
    { value: 'own', label: 'My Templates', icon: '👤' },
    { value: 'public', label: 'Community Templates', icon: '🌟' }
  ]

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen, selectedCategory, selectedSource])

  // Update selectedSource when defaultSource prop changes
  useEffect(() => {
    if (isOpen) {
      setSelectedSource(defaultSource)
    }
  }, [isOpen, defaultSource])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/`
      
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      
      // Handle source filtering
      if (selectedSource === 'own') {
        params.append('include_public', 'false')
      } else if (selectedSource === 'public') {
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/templates`
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await axios.get(url)
      setTemplates(response.data)
    } catch (error: any) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelect = async (template: CustomTemplate) => {
    try {
      // Increment usage count
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/${template.id}/use`)
      
      // Update local state
      setTemplates(prev => prev.map(t => 
        t.id === template.id 
          ? { ...t, usage_count: t.usage_count + 1 }
          : t
      ))

      onTemplateSelect(template)
      onClose()
    } catch (error: any) {
      console.error('Error using template:', error)
      toast.error('Failed to use template')
    }
  }

  const handleCopyContent = async (content: string, templateName: string, e: React.MouseEvent) => {
    e.stopPropagation()
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
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    const matchesSource = selectedSource === 'all' || 
      (selectedSource === 'own' && template.is_own_template) ||
      (selectedSource === 'public' && !template.is_own_template)
    
    return matchesSearch && matchesCategory && matchesSource
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl w-full max-w-5xl h-full sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">Select Template</h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden sm:block">Choose a template to load into your content editor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search templates by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Source Filter */}
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base flex-1"
              >
                {sourceFilters.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.icon} {source.label}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base flex-1"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 animate-pulse shadow-sm">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 sm:mb-3"></div>
                  <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded mb-1 sm:mb-2"></div>
                  <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
              <h4 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-400 mb-2">
                {searchQuery ? 'No templates found' : 'No templates yet'}
              </h4>
              <p className="text-gray-500 dark:text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base px-4">
                {searchQuery 
                  ? `No templates match "${searchQuery}"`
                  : 'Create your first custom template to get started'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800/70 shadow-sm hover:shadow-md"
                >
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center flex-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mr-3 border border-blue-500/30">
                        <span className="text-sm">{getCategoryIcon(template.category)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-gray-900 dark:text-white font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {template.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">{template.category}</span>
                          {template.is_own_template ? (
                            <span className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                              👤 Mine
                            </span>
                          ) : (
                            <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                              🌟 Community
                            </span>
                          )}
                          {template.is_favorite && (
                            <Star className="w-3 h-3 text-yellow-500 dark:text-yellow-400 fill-current" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleCopyContent(template.content, template.name, e)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Description */}
                  {template.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {/* Tags */}
                  {template.tags && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.split(',').slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                      {template.tags.split(',').length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                          +{template.tags.split(',').length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Used {template.usage_count} times
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(template.created_at)}
                    </div>
                  </div>

                  {/* Content Preview Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedTemplate(expandedTemplate === template.id ? null : template.id)
                    }}
                    className="mt-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-xs flex items-center transition-colors"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    {expandedTemplate === template.id ? 'Hide' : 'Preview'} Content
                  </button>
                  
                  {expandedTemplate === template.id && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <pre className="text-gray-700 dark:text-gray-300 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {template.content.substring(0, 300)}
                        {template.content.length > 300 && '...'}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default TemplateSelector