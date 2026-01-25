'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Edit, Trash2, Star, Globe, Lock, Copy, Eye, Tag, Calendar, TrendingUp, Crown } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import CustomTemplateModal from './CustomTemplateModal'
import { useAuth } from '../contexts/AuthContext'

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

interface CustomTemplateManagerProps {
  onTemplateSelect?: (template: CustomTemplate) => void
  showSelectButton?: boolean
  hideHeader?: boolean // Add prop to hide header when used in dashboard
  onClose?: () => void // Add prop to close modal when navigating
}

const CustomTemplateManager: React.FC<CustomTemplateManagerProps> = ({
  onTemplateSelect,
  showSelectButton = false,
  hideHeader = false,
  onClose
}) => {
  const { user } = useAuth()
  const router = useRouter()
  const [templates, setTemplates] = useState<CustomTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null)

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'blog', label: 'Blog Posts' },
    { value: 'newsletter', label: 'Newsletters' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'social', label: 'Social Media' },
    { value: 'other', label: 'Other' }
  ]

  useEffect(() => {
    // Only load templates for premium users
    if (user?.is_premium) {
      loadTemplates()
    } else {
      // Clear templates for non-premium users
      setTemplates([])
      setIsLoading(false)
    }
  }, [selectedCategory, user?.is_premium])

  const loadTemplates = async () => {
    // Don't load templates for non-premium users
    if (!user?.is_premium) {
      setTemplates([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      // Only load user's own templates in the management interface
      params.append('include_public', 'false')
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/?${params.toString()}`
      const response = await axios.get(url)
      setTemplates(response.data)
    } catch (error: any) {
      console.error('Error loading templates:', error)
      if (error.response?.status === 403) {
        toast.error('🔒 Custom templates are available for Pro users only!')
      } else {
        toast.error('Failed to load templates')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateCreated = (newTemplate: CustomTemplate) => {
    setTemplates(prev => [newTemplate, ...prev])
    setShowCreateModal(false)
    setEditingTemplate(null)
  }

  const handleTemplateUpdated = (updatedTemplate: CustomTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t))
    setEditingTemplate(null)
  }

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/${templateId}`)
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      toast.success('Template deleted successfully')
    } catch (error: any) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  const handleUseTemplate = async (template: CustomTemplate) => {
    try {
      // Increment usage count
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/${template.id}/use`)
      
      // Update local state
      setTemplates(prev => prev.map(t => 
        t.id === template.id 
          ? { ...t, usage_count: t.usage_count + 1 }
          : t
      ))

      if (onTemplateSelect) {
        onTemplateSelect(template)
      }
      
      toast.success(`Template "${template.name}" loaded!`)
    } catch (error: any) {
      console.error('Error using template:', error)
      toast.error('Failed to use template')
    }
  }

  const handleCopyContent = async (content: string, templateName: string) => {
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

  const toggleFavorite = async (template: CustomTemplate) => {
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/${template.id}`, {
        is_favorite: !template.is_favorite
      })
      
      setTemplates(prev => prev.map(t => 
        t.id === template.id 
          ? { ...t, is_favorite: !t.is_favorite }
          : t
      ))
      
      toast.success(template.is_favorite ? 'Removed from favorites' : 'Added to favorites')
    } catch (error: any) {
      console.error('Error toggling favorite:', error)
      toast.error('Failed to update favorite status')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'blog': return '📝'
      case 'newsletter': return '📧'
      case 'marketing': return '🎯'
      case 'social': return '📱'
      default: return '📄'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const filteredTemplates = templates.filter(template => {
    if (selectedCategory === 'all') return true
    return template.category === selectedCategory
  })

  return (
    <div className="space-y-6">
      {/* Header - Only show if not hidden */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Custom Templates</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.is_premium 
                ? 'Create and manage your reusable content templates'
                : 'Upgrade to Pro to create and manage custom templates'
              }
            </p>
          </div>
          {user?.is_premium ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg px-4 py-2">
                <Crown className="w-4 h-4 text-yellow-500 dark:text-yellow-400 mr-2" />
                <span className="text-yellow-500 dark:text-yellow-400 font-medium text-sm">Pro Feature</span>
              </div>
              <button
                onClick={() => toast.error('🔒 Custom templates are available for Pro users only!')}
                className="px-4 py-2 bg-gray-600/20 text-gray-500 rounded-lg font-medium transition-all duration-200 flex items-center cursor-not-allowed border border-gray-600/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </button>
            </div>
          )}
        </div>
      )}

      {/* New Template Button for Dashboard (when header is hidden) */}
      {hideHeader && user?.is_premium && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </button>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedCategory === category.value
                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-500 dark:text-blue-400 border border-blue-500/30'
                : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-500 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-400 mb-2">
            {user?.is_premium ? 'No Templates Yet' : 'Custom Templates - Pro Feature'}
          </h4>
          <p className="text-gray-600 dark:text-gray-500 mb-6">
            {user?.is_premium 
              ? (selectedCategory === 'all' 
                  ? 'Create your first custom template to get started'
                  : `No templates found in the ${categories.find(c => c.value === selectedCategory)?.label} category`
                )
              : 'Upgrade to Pro to create and manage your own custom templates'
            }
          </p>
          {user?.is_premium ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center mx-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Template
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl px-6 py-3">
                <Crown className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-3" />
                <div className="text-center">
                  <span className="text-yellow-500 dark:text-yellow-400 font-semibold">Pro Feature Required</span>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Unlock custom templates with Pro</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onClose) {
                    onClose() // Close the dashboard modal first
                  }
                  router.push('/pricing') // Then navigate using Next.js router
                }}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 group shadow-sm"
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mr-3 border border-blue-500/30">
                    <span className="text-lg">{getCategoryIcon(template.category)}</span>
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-semibold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-500 dark:text-blue-400 transition-colors">
                      {template.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">{template.category}</span>
                      {template.is_public ? (
                        <Globe className="w-3 h-3 text-green-400" />
                      ) : (
                        <Lock className="w-3 h-3 text-gray-500 dark:text-gray-500" />
                      )}
                      {template.is_favorite && (
                        <Star className="w-3 h-3 text-yellow-600 dark:text-yellow-500 dark:text-yellow-400 fill-current" />
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleFavorite(template)}
                  className={`p-1 rounded transition-colors ${
                    template.is_favorite 
                      ? 'text-yellow-600 dark:text-yellow-500 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300' 
                      : 'text-gray-500 dark:text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-500 dark:text-yellow-400'
                  }`}
                >
                  <Star className={`w-4 h-4 ${template.is_favorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Description */}
              {template.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {template.description}
                </p>
              )}

              {/* Tags */}
              {template.tags && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.split(',').slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                  {template.tags.split(',').length > 3 && (
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                      +{template.tags.split(',').length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-4">
                <div className="flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Used {template.usage_count} times
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(template.created_at)}
                </div>
              </div>

              {/* Content Preview */}
              <div className="mb-4">
                <button
                  onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-sm flex items-center transition-colors"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {expandedTemplate === template.id ? 'Hide' : 'Preview'} Content
                </button>
                
                {expandedTemplate === template.id && (
                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <pre className="text-gray-700 dark:text-gray-300 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {template.content.substring(0, 300)}
                      {template.content.length > 300 && '...'}
                    </pre>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {showSelectButton && onTemplateSelect && (
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Use Template
                  </button>
                )}
                
                <button
                  onClick={() => handleCopyContent(template.content, template.name)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => {
                    if (!user?.is_premium) {
                      toast.error('🔒 Template editing is available for Pro users only!')
                      return
                    }
                    setEditingTemplate(template)
                  }}
                  className={`p-2 transition-colors ${
                    user?.is_premium 
                      ? 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={!user?.is_premium}
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => {
                    if (!user?.is_premium) {
                      toast.error('🔒 Template deletion is available for Pro users only!')
                      return
                    }
                    handleDeleteTemplate(template.id)
                  }}
                  className={`p-2 transition-colors ${
                    user?.is_premium 
                      ? 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 dark:text-red-400'
                      : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={!user?.is_premium}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal - Pro Only */}
      {user?.is_premium && (
        <CustomTemplateModal
          isOpen={showCreateModal || !!editingTemplate}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTemplate(null)
          }}
          onTemplateCreated={editingTemplate ? handleTemplateUpdated : handleTemplateCreated}
          editTemplate={editingTemplate}
        />
      )}
    </div>
  )
}

export default CustomTemplateManager