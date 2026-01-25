'use client'

import { useState, useEffect } from 'react'
import { X, Save, FileText, Tag, Globe, Lock, Star, Sparkles } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface CustomTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onTemplateCreated?: (template: any) => void
  editTemplate?: any // If provided, we're editing an existing template
}

interface TemplateCategory {
  value: string
  label: string
  description: string
}

const CustomTemplateModal: React.FC<CustomTemplateModalProps> = ({
  isOpen,
  onClose,
  onTemplateCreated,
  editTemplate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'blog',
    content: '',
    tags: '',
    is_public: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<TemplateCategory[]>([])

  // Load categories on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  // Populate form when editing
  useEffect(() => {
    if (editTemplate) {
      setFormData({
        name: editTemplate.name || '',
        description: editTemplate.description || '',
        category: editTemplate.category || 'blog',
        content: editTemplate.content || '',
        tags: editTemplate.tags || '',
        is_public: editTemplate.is_public || false
      })
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        description: '',
        category: 'blog',
        content: '',
        tags: '',
        is_public: false
      })
    }
  }, [editTemplate, isOpen])

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/categories/list`)
      setCategories(response.data.categories)
    } catch (error) {
      console.error('Error loading categories:', error)
      // Fallback categories
      setCategories([
        { value: 'blog', label: 'Blog Post', description: 'Blog articles and posts' },
        { value: 'newsletter', label: 'Newsletter', description: 'Email newsletters and updates' },
        { value: 'marketing', label: 'Marketing', description: 'Marketing content and campaigns' },
        { value: 'social', label: 'Social Media', description: 'Social media posts and content' },
        { value: 'other', label: 'Other', description: 'Other types of content' }
      ])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a template name')
      return
    }
    
    if (!formData.content.trim()) {
      toast.error('Please enter template content')
      return
    }

    setIsLoading(true)

    try {
      let response
      if (editTemplate) {
        // Update existing template
        response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/${editTemplate.id}`,
          formData
        )
        toast.success('Template updated successfully!')
      } else {
        // Create new template
        response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/`,
          formData
        )
        toast.success('Template created successfully!')
      }

      if (onTemplateCreated) {
        onTemplateCreated(response.data)
      }
      
      onClose()
    } catch (error: any) {
      console.error('Error saving template:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to save template'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const insertSampleContent = (type: string) => {
    let sampleContent = ''
    
    switch (type) {
      case 'blog':
        sampleContent = `# Your Blog Title Here

## Introduction
Start with a compelling hook that draws readers in...

## Main Content
### Key Point 1
Explain your first main point with supporting details and examples.

### Key Point 2
Develop your second key point with evidence and insights.

### Key Point 3
Present your final main point with actionable advice.

## Conclusion
Wrap up with a strong conclusion that reinforces your main message and includes a call to action.`
        break
      case 'newsletter':
        sampleContent = `# Weekly Newsletter - [Date]

## 🚀 This Week's Highlights
- Key update or announcement
- Important industry news
- Featured content or resource

## 📊 What's Trending
Brief overview of current trends in your industry...

## 💡 Quick Tip
Share a valuable tip or insight...

## 🔗 Recommended Reading
- [Article Title](link)
- [Resource Name](link)

## 📅 Coming Up Next Week
Preview of what's coming...

Thanks for reading!`
        break
      case 'marketing':
        sampleContent = `# [Campaign/Product Name]: Transform Your [Target Outcome]

## The Problem
Describe the pain point your audience faces...

## The Solution
Introduce your product/service as the solution...

## Key Benefits
✅ Benefit 1: Specific outcome
✅ Benefit 2: Measurable result  
✅ Benefit 3: Unique advantage

## Social Proof
"Customer testimonial or case study result..."

## Call to Action
Ready to [desired action]? [Clear next step]`
        break
      case 'social':
        sampleContent = `🚀 [Attention-grabbing opening]

[Main message or value proposition]

Key points:
• Point 1
• Point 2  
• Point 3

💡 Pro tip: [Actionable advice]

What's your experience with [topic]? Share below! 👇

#hashtag1 #hashtag2 #hashtag3`
        break
      default:
        sampleContent = `# Template Title

Your content goes here...

## Section 1
Content for section 1

## Section 2
Content for section 2

## Conclusion
Wrap up your content`
    }
    
    handleInputChange('content', sampleContent)
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} template structure inserted!`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editTemplate ? 'Edit Template' : 'Create Custom Template'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {editTemplate ? 'Update your custom template' : 'Create a reusable content template'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Template Name and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., My Blog Template"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of this template"
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="e.g., tech, startup, productivity (comma-separated)"
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Separate tags with commas</p>
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Template Content *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => insertSampleContent(formData.category)}
                    className="px-3 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs rounded-full border border-blue-500/30 hover:bg-blue-500/30 transition-colors flex items-center"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Insert Structure
                  </button>
                </div>
              </div>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Enter your template content here... Use markdown formatting for best results."
                className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Supports markdown formatting. Use placeholders like [Your Title] for customizable parts.
              </p>
            </div>

            {/* Privacy Setting */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {formData.is_public ? (
                    <Globe className="w-5 h-5 text-green-400 mr-3" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400 mr-3" />
                  )}
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium">
                      {formData.is_public ? 'Public Template' : 'Private Template'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {formData.is_public 
                        ? 'Other users can discover and use this template'
                        : 'Only you can see and use this template'
                      }
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => handleInputChange('is_public', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formData.content.length} characters
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim() || !formData.content.trim()}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    {editTemplate ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editTemplate ? 'Update Template' : 'Create Template'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomTemplateModal