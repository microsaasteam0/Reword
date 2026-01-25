'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { User, Settings, History, Heart, BarChart3, Crown, LogOut, Save, Trash2, Star, Download, Eye, Filter, Edit2, Check, X, FileText, Copy, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useFeatureGate } from '../hooks/useFeatureGate'
import { useUserPreferences } from '../contexts/UserPreferencesContext'
import CustomTemplateManager from './CustomTemplateManager'
import LoadingSpinner from './LoadingSpinner'
import Pagination from './Pagination'
import ImageEditor from './ImageEditor'
import { requestCache } from '@/lib/cache-util'
import axios from 'axios'
import toast from 'react-hot-toast'

interface SavedContent {
  id: number
  title: string
  content_type: string
  content: string
  tags?: string
  is_favorite: boolean
  created_at: string
  updated_at?: string
}

interface ContentHistory {
  id: number
  original_content: string
  content_source?: string
  twitter_thread?: string
  linkedin_post?: string
  instagram_carousel?: string
  processing_time?: number
  created_at: string
}

interface UsageStats {
  total_generations: number
  recent_generations: number
  rate_limit: number
  remaining_requests: number
  is_premium: boolean
}

interface DashboardModalProps {
  isOpen: boolean
  onClose: () => void
  externalUsageStats?: UsageStats | null
}

export default function DashboardModal({ isOpen, onClose, externalUsageStats }: DashboardModalProps) {
  const { user, logout, updateUser } = useAuth()
  const featureGate = useFeatureGate()
  const { autoSaveEnabled, setAutoSaveEnabled, emailNotificationsEnabled, setEmailNotificationsEnabled } = useUserPreferences()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // State management
  const [activeSection, setActiveSection] = useState('overview')
  const [savedContent, setSavedContent] = useState<SavedContent[]>([])
  const [contentHistory, setContentHistory] = useState<ContentHistory[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [viewingContent, setViewingContent] = useState<SavedContent | null>(null)
  const [deletingContent, setDeletingContent] = useState<SavedContent | null>(null)

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedUsername, setEditedUsername] = useState('')
  const [editedFullName, setEditedFullName] = useState('')
  const [editedProfilePicture, setEditedProfilePicture] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    scale: 1
  })
  const [imageEditorRef, setImageEditorRef] = useState<HTMLCanvasElement | null>(null)

  // Helper function to validate image URL
  const isValidImageUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false

    // Check for base64 images
    if (url.startsWith('data:image/')) {
      return true
    }

    // Check for regular URLs
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      // Validate file size (max 5MB for editing)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      setSelectedFile(file)

      // Create preview URL and show editor
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setPreviewUrl(imageUrl)
        setShowImageEditor(true)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle image crop and adjustment
  const handleImageCrop = (canvas: HTMLCanvasElement) => {
    // Convert canvas to blob with compression
    canvas.toBlob((blob) => {
      if (blob) {
        // Validate final size (max 750KB after compression)
        if (blob.size > 750 * 1024) {
          toast.error('Cropped image is too large. Please crop a smaller area or reduce quality.')
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          const croppedImageUrl = e.target?.result as string
          setEditedProfilePicture(croppedImageUrl)
          setShowImageEditor(false)
          setShowProfilePictureModal(false)

          // Auto-save the cropped image
          handleImageUpload(croppedImageUrl)
        }
        reader.readAsDataURL(blob)
      }
    }, 'image/jpeg', 0.8) // 80% quality for compression
  }

  // Upload image to a service (you'll need to implement this)
  const uploadImage = async (imageData?: string): Promise<string> => {
    // Use provided imageData or convert selected file to base64
    if (imageData) {
      return imageData
    }

    if (!selectedFile) {
      throw new Error('No image selected')
    }

    // For now, we'll convert to base64 and store it directly
    // In production, you should upload to a cloud service like AWS S3, Cloudinary, etc.
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Limit base64 size to prevent issues (max 1MB base64 ≈ 750KB original)
        if (result.length > 1000000) {
          reject(new Error('Image too large. Please select a smaller image (max 750KB).'))
          return
        }
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(selectedFile)
    })
  }

  // Handle image upload and save
  const handleImageUpload = async (imageData?: string) => {
    if (!selectedFile) {
      toast.error('Please select an image first')
      return
    }

    setIsUploading(true)
    try {
      console.log('🔄 Starting image upload process...')
      console.log('📁 File size:', selectedFile.size, 'bytes')
      console.log('� File type:', selectedFile.type)

      const imageUrl = await uploadImage(imageData)
      console.log('✅ Image converted to base64, length:', imageUrl.length)

      setEditedProfilePicture(imageUrl)

      // Immediately save the profile with the new image
      console.log('🔄 Saving profile with new image...')
      console.log('📝 Current username:', editedUsername)
      console.log('� CuUrrent full name:', editedFullName)

      const profileData = {
        username: editedUsername.trim(),
        full_name: editedFullName.trim() || null,
        profile_picture: imageUrl
      }

      console.log('📤 Sending profile data (image truncated for log):', {
        ...profileData,
        profile_picture: imageUrl.substring(0, 50) + '...'
      })

      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/profile`, profileData, {
        timeout: 30000, // 30 second timeout for large images
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ Profile update response:', response.data)

      if (response.data) {
        // Update user context with new data
        console.log('🔄 Updating user context...')
        console.log('📸 New profile picture from response:', response.data.profile_picture?.substring(0, 50) + '...')

        const updatedUserData = {
          username: response.data.username,
          full_name: response.data.full_name,
          profile_picture: response.data.profile_picture
        }

        console.log('👤 Updating user with:', {
          ...updatedUserData,
          profile_picture: updatedUserData.profile_picture?.substring(0, 50) + '...'
        })

        updateUser(updatedUserData)

        // Also update the local editing state to reflect the change immediately
        setEditedProfilePicture(response.data.profile_picture)

        setShowProfilePictureModal(false)
        setSelectedFile(null)
        setPreviewUrl('')

        // Force a small delay to ensure state updates
        setTimeout(() => {
          toast.success('Profile picture updated successfully!')
          console.log('✅ Profile picture update complete!')

          // Force a re-render by updating a dummy state
          setIsEditingProfile(false)
          setTimeout(() => setIsEditingProfile(true), 100)
        }, 100)
      }
    } catch (error: any) {
      console.error('❌ Error uploading and saving profile picture:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      console.error('❌ Error message:', error.message)

      if (error.message.includes('Image too large')) {
        toast.error(error.message)
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Invalid image data')
      } else if (error.response?.status === 413) {
        toast.error('Image too large. Please select a smaller image.')
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Upload timeout. Please try with a smaller image.')
      } else {
        toast.error('Failed to upload profile picture. Please try again.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPerPage, setHistoryPerPage] = useState(5)

  // Subscription management state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  // Check if component is mounted (for portal)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      console.log('🚀 Dashboard modal opened, loading initial data')
      console.log('👤 Current user object:', user)
      console.log('🖼️ User profile picture:', user.profile_picture)
      loadInitialDataFast()

      // Initialize profile editing state
      setEditedUsername(user.username || '')
      setEditedFullName(user.full_name || '')
      setEditedProfilePicture(user.profile_picture || '')

      // Immediately check cache and load section data in parallel
      if (user.is_premium) {
        console.log('🚀 Immediately loading saved content for premium user')
        const contentCacheKey = `dashboard-saved-content-${user.id}`
        const cachedContent = requestCache.getCached(contentCacheKey)
        if (cachedContent && Array.isArray(cachedContent)) {
          console.log('✅ Using cached saved content immediately')
          setSavedContent(cachedContent)
        }
        loadSectionData('content')
      }

      console.log('🚀 Immediately loading content history for user')
      const historyCacheKey = `dashboard-content-history-${user.id}`
      const cachedHistory = requestCache.getCached(historyCacheKey)
      if (cachedHistory && Array.isArray(cachedHistory)) {
        console.log('✅ Using cached content history immediately')
        setContentHistory(cachedHistory)
      }
      loadSectionData('history')
    }
  }, [isOpen, user])

  // Preload data when user is available (even when modal is closed)
  useEffect(() => {
    if (user && !isOpen) {
      console.log('🚀 Preloading dashboard data in background')

      // Preload usage stats
      const statsCacheKey = `dashboard-usage-stats-${user.id}`
      if (!requestCache.getCached(statsCacheKey)) {
        requestCache.get(
          statsCacheKey,
          async () => {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/usage-stats`, {
              timeout: 5000
            })
            return response.data
          },
          5 * 60 * 1000
        ).catch(() => { }) // Silent fail for background loading
      }

      // Preload content history for all users
      const historyCacheKey = `dashboard-content-history-${user.id}`
      if (!requestCache.getCached(historyCacheKey)) {
        requestCache.get(
          historyCacheKey,
          async () => {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/content/history`, {
              timeout: 5000
            })
            return response.data || []
          },
          30 * 60 * 1000
        ).catch(() => { }) // Silent fail for background loading
      }

      // Preload saved content for premium users
      if (user.is_premium) {
        const contentCacheKey = `dashboard-saved-content-${user.id}`
        if (!requestCache.getCached(contentCacheKey)) {
          requestCache.get(
            contentCacheKey,
            async () => {
              const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/content/saved`, {
                timeout: 5000
              })
              return response.data || []
            },
            30 * 60 * 1000
          ).catch(() => { }) // Silent fail for background loading
        }
      }
    }
  }, [user, isOpen])

  // Load only essential data first with request deduplication
  const loadInitialDataFast = async () => {
    try {
      // If we have external usage stats, use them immediately
      if (externalUsageStats) {
        console.log('📦 Using external usage stats from parent')
        setUsageStats(externalUsageStats)
        return
      }

      // Use request cache for deduplication
      const cacheKey = `dashboard-usage-stats-${user?.id}`
      const stats = await requestCache.get(
        cacheKey,
        async () => {
          console.log('🔄 DashboardModal: Making fresh usage-stats API call')
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/usage-stats`, {
            timeout: 5000 // Increased timeout
          })
          return response.data
        },
        5 * 60 * 1000 // 5 minute cache
      )

      setUsageStats(stats)
      console.log('✅ Loaded usage stats for dashboard:', stats)
    } catch (error: any) {
      console.error('Error in loadInitialDataFast:', error)
      // Set default stats if everything fails
      const fallbackStats = {
        total_generations: 0,
        recent_generations: 0,
        rate_limit: user?.is_premium ? 999 : 10,
        remaining_requests: user?.is_premium ? 999 : 10,
        is_premium: user?.is_premium || false
      }
      setUsageStats(fallbackStats)
    }
  }

  // Load section-specific data when user navigates to that section
  const loadSectionData = async (section: string) => {
    console.log(`🔄 Loading section data for: ${section}`)

    if (section === 'content') {
      const cacheKey = `dashboard-saved-content-${user?.id}`
      const cachedContent = requestCache.getCached(cacheKey)

      // Only show loading if we don't have cached data
      if (!cachedContent || !Array.isArray(cachedContent) || cachedContent.length === 0) {
        setIsLoadingContent(true)
      } else {
        // Use cached data immediately
        console.log('✅ Using cached saved content:', cachedContent.length, 'items')
        setSavedContent(cachedContent)
      }

      try {
        console.log(`🔍 Loading saved content with cache key: ${cacheKey}`)

        const content = await requestCache.get(
          cacheKey,
          async () => {
            console.log('🔄 DashboardModal: Making fresh saved-content API call')
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/content/saved`, {
              timeout: 10000 // Increased timeout
            })
            console.log('📦 Saved content API response:', response.data)
            return response.data || []
          },
          30 * 60 * 1000 // 30 minute cache
        )

        console.log('✅ Setting saved content:', content.length, 'items')
        setSavedContent(content)
      } catch (error: any) {
        console.error('Error loading saved content:', error)
        if (error.response?.status === 403) {
          console.log('Premium features not available for this user')
        } else {
          // Retry once after a short delay
          setTimeout(() => {
            console.log('🔄 Retrying saved content load...')
            loadSectionData('content')
          }, 1000)
        }
        setSavedContent([])
      } finally {
        setIsLoadingContent(false)
      }
    } else if (section === 'history') {
      const cacheKey = `dashboard-content-history-${user?.id}`
      const cachedHistory = requestCache.getCached(cacheKey)

      // Only show loading if we don't have cached data
      if (!cachedHistory || !Array.isArray(cachedHistory) || cachedHistory.length === 0) {
        setIsLoadingHistory(true)
      } else {
        // Use cached data immediately
        console.log('✅ Using cached content history:', cachedHistory.length, 'items')
        setContentHistory(cachedHistory)
      }

      try {
        console.log(`🔍 Loading content history with cache key: ${cacheKey}`)

        const history = await requestCache.get(
          cacheKey,
          async () => {
            console.log('🔄 DashboardModal: Making fresh content-history API call')
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/content/history`, {
              timeout: 10000 // Increased timeout
            })
            console.log('📦 Content history API response:', response.data)
            return response.data || []
          },
          30 * 60 * 1000 // 30 minute cache
        )

        console.log('✅ Setting content history:', history.length, 'items')
        setContentHistory(history)
      } catch (error: any) {
        console.error('Error loading content history:', error)
        if (error.response?.status === 403) {
          console.log('Premium features not available for this user')
        } else {
          // Retry once after a short delay
          setTimeout(() => {
            console.log('🔄 Retrying content history load...')
            loadSectionData('history')
          }, 1000)
        }
        setContentHistory([])
      } finally {
        setIsLoadingHistory(false)
      }
    }
  }

  // Load data when section changes
  useEffect(() => {
    if (isOpen && user && activeSection !== 'overview') {
      console.log(`🔄 Section changed to: ${activeSection}, checking if data needs loading`)

      // Only load if we don't already have data for this section
      if (activeSection === 'content' && user.is_premium && savedContent.length === 0) {
        console.log('🔄 Loading saved content for empty state')
        loadSectionData('content')
      } else if (activeSection === 'history' && contentHistory.length === 0) {
        console.log('🔄 Loading content history for empty state')
        loadSectionData('history')
      } else {
        console.log(`✅ Section ${activeSection} already has data, skipping load`)
      }
    }
  }, [activeSection, isOpen, user])

  // Force refresh data after content generation
  const refreshAfterGeneration = async () => {
    console.log('🔄 Dashboard: Refreshing data after content generation')

    // Invalidate caches
    const contentCacheKey = `dashboard-saved-content-${user?.id}`
    const historyCacheKey = `dashboard-content-history-${user?.id}`

    requestCache.invalidate(contentCacheKey)
    requestCache.invalidate(historyCacheKey)

    // Refresh saved content if currently loaded
    if (savedContent.length > 0) {
      try {
        const content = await requestCache.get(
          contentCacheKey,
          async () => {
            console.log('🔄 DashboardModal: Refreshing saved-content after generation')
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/content/saved`, {
              timeout: 2000
            })
            return response.data || []
          },
          30 * 60 * 1000
        )
        setSavedContent(content)
      } catch (error) {
        console.error('Error refreshing saved content:', error)
      }
    }

    // Refresh history if currently loaded
    if (contentHistory.length > 0) {
      try {
        const history = await requestCache.get(
          historyCacheKey,
          async () => {
            console.log('🔄 DashboardModal: Refreshing content-history after generation')
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/content/history`, {
              timeout: 2000
            })
            return response.data || []
          },
          30 * 60 * 1000
        )
        setContentHistory(history)
      } catch (error) {
        console.error('Error refreshing content history:', error)
      }
    }

    // Also refresh usage stats
    loadInitialDataFast()
  }

  // Listen for content-saved and content-generated events to refresh data
  useEffect(() => {
    const handleContentSaved = (event: CustomEvent) => {
      console.log('🔄 Dashboard: Content saved event received')

      // Only refresh saved content, not history (history tracks generations, not saves)
      if (user?.is_premium && isOpen && savedContent.length > 0) {
        // Refresh saved content
        const contentCacheKey = `dashboard-saved-content-${user?.id}`
        requestCache.invalidate(contentCacheKey)

        // Reload saved content
        loadSectionData('content')
      } else if (user?.is_premium) {
        // If dashboard is closed, just invalidate saved content cache for next time
        const contentCacheKey = `dashboard-saved-content-${user?.id}`
        requestCache.invalidate(contentCacheKey)
      }
    }

    const handleContentGenerated = (event: CustomEvent) => {
      console.log('🔄 Dashboard: Content generated event received')

      // Refresh both saved content and history after generation
      if (user?.is_premium && isOpen) {
        refreshAfterGeneration()
      } else if (user?.is_premium) {
        // If dashboard is closed, just invalidate caches for next time
        const contentCacheKey = `dashboard-saved-content-${user?.id}`
        const historyCacheKey = `dashboard-content-history-${user?.id}`
        requestCache.invalidate(contentCacheKey)
        requestCache.invalidate(historyCacheKey)
      }
    }

    // Listen for both events regardless of whether dashboard is open
    window.addEventListener('content-saved', handleContentSaved as EventListener)
    window.addEventListener('content-generated', handleContentGenerated as EventListener)

    return () => {
      window.removeEventListener('content-saved', handleContentSaved as EventListener)
      window.removeEventListener('content-generated', handleContentGenerated as EventListener)
    }
  }, [isOpen, user, savedContent.length, contentHistory.length])

  const handleDeleteContent = async (contentId: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/content/saved/${contentId}`)
      setSavedContent(prev => prev.filter(item => item.id !== contentId))
      setDeletingContent(null)
      toast.success('Content deleted successfully')
    } catch (error) {
      console.error('Error deleting content:', error)
      toast.error('Failed to delete content')
    }
  }

  const handleToggleFavorite = async (contentId: number) => {
    const content = savedContent.find(item => item.id === contentId)
    if (!content) return

    // Optimistic update - update UI immediately
    const newFavoriteState = !content.is_favorite
    setSavedContent(prev => prev.map(item =>
      item.id === contentId
        ? { ...item, is_favorite: newFavoriteState }
        : item
    ))

    // Also update the viewing content if it's the same item
    if (viewingContent && viewingContent.id === contentId) {
      setViewingContent(prev => prev ? { ...prev, is_favorite: newFavoriteState } : null)
    }

    // Show immediate feedback
    toast.success(newFavoriteState ? 'Added to favorites' : 'Removed from favorites')

    // Make API call in background
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/content/saved/${contentId}`, {
        is_favorite: newFavoriteState
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)

      // Revert the optimistic update on error
      setSavedContent(prev => prev.map(item =>
        item.id === contentId
          ? { ...item, is_favorite: !newFavoriteState }
          : item
      ))

      // Also revert viewing content if it's the same item
      if (viewingContent && viewingContent.id === contentId) {
        setViewingContent(prev => prev ? { ...prev, is_favorite: !newFavoriteState } : null)
      }

      toast.error('Failed to update favorite status')
    }
  }

  const handleCancelSubscription = async () => {
    setCancelLoading(true)
    try {
      // Set flag to indicate this is a manual cancellation
      sessionStorage.setItem('manual_cancellation', 'true')

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payment/cancel`)

      if (response.data.success) {
        // Update user state
        updateUser({ is_premium: false })

        // Clear all cached usage stats to force refresh everywhere
        const keys = Object.keys(sessionStorage)
        keys.forEach(key => {
          if (key.includes('usage_stats') || key.includes('dashboard_stats')) {
            sessionStorage.removeItem(key)
          }
        })

        // Refresh feature gate limits
        await featureGate.refreshLimits()

        // Reload fresh usage stats
        await loadInitialDataFast()

        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('subscription-cancelled', {
          detail: { is_premium: false }
        }))

        toast.success('Subscription cancelled successfully')
        setShowCancelModal(false)
      } else {
        toast.error(response.data.message || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error('Failed to cancel subscription')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!editedUsername.trim()) {
      toast.error('Username is required')
      return
    }

    setIsSavingProfile(true)
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/profile`, {
        username: editedUsername.trim(),
        full_name: editedFullName.trim() || null,
        profile_picture: editedProfilePicture.trim() || null
      })

      if (response.data) {
        // Update user context with new data
        updateUser({
          username: response.data.username,
          full_name: response.data.full_name,
          profile_picture: response.data.profile_picture
        })

        setIsEditingProfile(false)
        toast.success('Profile updated successfully!')
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Username already exists')
      } else {
        toast.error('Failed to update profile')
      }
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedUsername(user?.username || '')
    setEditedFullName(user?.full_name || '')
    setEditedProfilePicture(user?.profile_picture || '')
    setIsEditingProfile(false)
  }

  // Export functions
  const handleExportContent = (content: SavedContent, format: 'txt' | 'json' | 'csv') => {
    if (!user?.is_premium) {
      toast.error('Export features are available for Pro users only!')
      return
    }

    try {
      let exportData: string
      let filename: string
      let mimeType: string

      const sanitizedTitle = content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const timestamp = new Date().toISOString().split('T')[0]

      switch (format) {
        case 'txt':
          exportData = `Title: ${content.title}\n` +
            `Type: ${content.content_type}\n` +
            `Created: ${new Date(content.created_at).toLocaleString()}\n` +
            `${content.updated_at ? `Updated: ${new Date(content.updated_at).toLocaleString()}\n` : ''}` +
            `Favorite: ${content.is_favorite ? 'Yes' : 'No'}\n` +
            `${content.tags ? `Tags: ${content.tags}\n` : ''}` +
            `\n--- Content ---\n\n${content.content}`
          filename = `${sanitizedTitle}_${timestamp}.txt`
          mimeType = 'text/plain'
          break

        case 'json':
          exportData = JSON.stringify({
            id: content.id,
            title: content.title,
            content_type: content.content_type,
            content: content.content,
            tags: content.tags,
            is_favorite: content.is_favorite,
            created_at: content.created_at,
            updated_at: content.updated_at,
            exported_at: new Date().toISOString()
          }, null, 2)
          filename = `${sanitizedTitle}_${timestamp}.json`
          mimeType = 'application/json'
          break

        case 'csv':
          // For CSV, we'll create a simple format with key-value pairs
          const csvRows = [
            ['Field', 'Value'],
            ['ID', content.id.toString()],
            ['Title', content.title],
            ['Type', content.content_type],
            ['Content', content.content.replace(/"/g, '""')], // Escape quotes
            ['Tags', content.tags || ''],
            ['Favorite', content.is_favorite ? 'Yes' : 'No'],
            ['Created', new Date(content.created_at).toLocaleString()],
            ['Updated', content.updated_at ? new Date(content.updated_at).toLocaleString() : ''],
            ['Exported', new Date().toLocaleString()]
          ]
          exportData = csvRows.map(row =>
            row.map(cell => `"${cell}"`).join(',')
          ).join('\n')
          filename = `${sanitizedTitle}_${timestamp}.csv`
          mimeType = 'text/csv'
          break

        default:
          throw new Error('Unsupported format')
      }

      // Create and download file
      const blob = new Blob([exportData], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Content exported as ${format.toUpperCase()}!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export content')
    }
  }

  const handleBulkExport = (format: 'txt' | 'json' | 'csv') => {
    if (!user?.is_premium) {
      toast.error('Export features are available for Pro users only!')
      return
    }

    if (savedContent.length === 0) {
      toast.error('No content to export')
      return
    }

    try {
      let exportData: string
      let filename: string
      let mimeType: string

      const timestamp = new Date().toISOString().split('T')[0]

      switch (format) {
        case 'txt':
          exportData = savedContent.map((content, index) =>
            `=== Content ${index + 1} ===\n` +
            `Title: ${content.title}\n` +
            `Type: ${content.content_type}\n` +
            `Created: ${new Date(content.created_at).toLocaleString()}\n` +
            `${content.updated_at ? `Updated: ${new Date(content.updated_at).toLocaleString()}\n` : ''}` +
            `Favorite: ${content.is_favorite ? 'Yes' : 'No'}\n` +
            `${content.tags ? `Tags: ${content.tags}\n` : ''}` +
            `\n--- Content ---\n\n${content.content}\n\n`
          ).join('\n' + '='.repeat(50) + '\n\n')
          filename = `snippetstream_content_${timestamp}.txt`
          mimeType = 'text/plain'
          break

        case 'json':
          exportData = JSON.stringify({
            exported_at: new Date().toISOString(),
            total_items: savedContent.length,
            content: savedContent.map(content => ({
              id: content.id,
              title: content.title,
              content_type: content.content_type,
              content: content.content,
              tags: content.tags,
              is_favorite: content.is_favorite,
              created_at: content.created_at,
              updated_at: content.updated_at
            }))
          }, null, 2)
          filename = `snippetstream_content_${timestamp}.json`
          mimeType = 'application/json'
          break

        case 'csv':
          const csvRows = [
            ['ID', 'Title', 'Type', 'Content', 'Tags', 'Favorite', 'Created', 'Updated']
          ]
          savedContent.forEach(content => {
            csvRows.push([
              content.id.toString(),
              content.title,
              content.content_type,
              content.content.replace(/"/g, '""'), // Escape quotes
              content.tags || '',
              content.is_favorite ? 'Yes' : 'No',
              new Date(content.created_at).toLocaleString(),
              content.updated_at ? new Date(content.updated_at).toLocaleString() : ''
            ])
          })
          exportData = csvRows.map(row =>
            row.map(cell => `"${cell}"`).join(',')
          ).join('\n')
          filename = `snippetstream_content_${timestamp}.csv`
          mimeType = 'text/csv'
          break

        default:
          throw new Error('Unsupported format')
      }

      // Create and download file
      const blob = new Blob([exportData], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`${savedContent.length} items exported as ${format.toUpperCase()}!`)
    } catch (error) {
      console.error('Bulk export error:', error)
      toast.error('Failed to export content')
    }
  }

  // Pagination helpers
  const getFilteredContent = () => {
    return savedContent.filter(item =>
      (filterType === 'all' || item.content_type === filterType) &&
      (searchTerm === '' || item.title.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  const getPaginatedContent = () => {
    const filtered = getFilteredContent()
    const startIndex = (currentPage - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }

  const getPaginatedHistory = () => {
    const startIndex = (historyPage - 1) * historyPerPage
    return contentHistory.slice(startIndex, startIndex + historyPerPage)
  }

  const getTotalPages = () => {
    return Math.ceil(getFilteredContent().length / itemsPerPage)
  }

  const getHistoryTotalPages = () => {
    return Math.ceil(contentHistory.length / historyPerPage)
  }

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open - less aggressive approach
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !user || !mounted) {
    return null
  }

  const modalElement = (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 hide-scrollbar"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5rem',
          overflow: 'hidden'
        }}
      >
        {/* Modal Content */}
        <div
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 rounded-xl sm:rounded-3xl flex flex-col sm:flex-row overflow-hidden shadow-2xl hide-scrollbar"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            maxWidth: 'min(95vw, 1200px)',
            maxHeight: '95vh',
            width: '100%',
            height: '95vh',
            margin: 'auto',
            display: 'flex'
          }}
        >
          {/* Mobile Header with Tab Navigation */}
          <div className="sm:hidden bg-gradient-to-r from-gray-50/80 to-gray-100/60 dark:from-slate-800/50 dark:to-slate-900/50 border-b border-gray-200/50 dark:border-slate-700/50 p-3 flex-shrink-0 hide-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {user?.profile_picture && isValidImageUrl(user.profile_picture) ? (
                    <>
                      <img
                        src={user.profile_picture}
                        alt={user.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('❌ Mobile header profile picture failed to load:', user.profile_picture)
                          // Hide the image and show initials
                          const imgElement = e.currentTarget as HTMLImageElement
                          const container = imgElement.parentElement
                          if (container) {
                            imgElement.style.display = 'none'
                            const fallbackDiv = container.querySelector('.mobile-user-initials') as HTMLElement
                            if (fallbackDiv) {
                              fallbackDiv.style.display = 'flex'
                            }
                          }
                        }}
                        onLoad={(e) => {
                          console.log('✅ Mobile header profile picture loaded successfully:', user.profile_picture)
                          // Hide initials when image loads
                          const imgElement = e.currentTarget as HTMLImageElement
                          const container = imgElement.parentElement
                          if (container) {
                            const fallbackDiv = container.querySelector('.mobile-user-initials') as HTMLElement
                            if (fallbackDiv) {
                              fallbackDiv.style.display = 'none'
                            }
                          }
                        }}
                      />
                      <div
                        className="mobile-user-initials w-full h-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ display: 'none' }}
                      >
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </>
                  ) : (
                    <div
                      className="mobile-user-initials w-full h-full flex items-center justify-center text-white font-bold text-sm"
                    >
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user?.username}</h2>
                  {user?.is_premium ? (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-600 dark:text-yellow-400 text-xs rounded-full border border-yellow-500/30 flex items-center gap-1 w-fit">
                      <Crown className="w-3 h-3" />
                      Pro
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-200/80 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs rounded-full border border-gray-300 dark:border-gray-600 w-fit">
                      Free
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    logout()
                    onClose()
                  }}
                  className="p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Tab Navigation */}
            <div className="grid grid-cols-5 gap-1">
              <button
                onClick={() => setActiveSection('overview')}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeSection === 'overview'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                <BarChart3 className="w-4 h-4" />
                Overview
              </button>

              <button
                onClick={() => {
                  setActiveSection('content')
                  loadSectionData('content')
                }}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${activeSection === 'content'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                <div className="relative">
                  <Save className="w-4 h-4" />
                  {savedContent.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1 min-w-[1rem] h-4 flex items-center justify-center text-[10px]">
                      {savedContent.length}
                    </span>
                  )}
                </div>
                Saved
              </button>

              <button
                onClick={() => {
                  setActiveSection('history')
                  loadSectionData('history')
                }}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${activeSection === 'history'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                <div className="relative">
                  <History className="w-4 h-4" />
                  {contentHistory.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1 min-w-[1rem] h-4 flex items-center justify-center text-[10px]">
                      {contentHistory.length}
                    </span>
                  )}
                </div>
                History
              </button>

              <button
                onClick={() => setActiveSection('templates')}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${activeSection === 'templates'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                <div className="relative">
                  <Edit2 className="w-4 h-4" />
                  {user?.is_premium && <Crown className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 text-yellow-500" />}
                </div>
                Templates
              </button>

              <button
                onClick={() => setActiveSection('settings')}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeSection === 'settings'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden sm:flex w-80 bg-gradient-to-b from-gray-50/80 to-gray-100/60 dark:from-slate-800/50 dark:to-slate-900/50 border-r border-gray-200/50 dark:border-slate-700/50 p-8 flex-col min-h-0 flex-shrink-0">
            {/* User Profile Section */}
            <div className="flex items-center gap-3 mb-8 p-3 bg-gray-100/50 dark:bg-slate-800/30 rounded-xl border border-gray-200/50 dark:border-slate-700/30">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                {user?.profile_picture && isValidImageUrl(user.profile_picture) ? (
                  <>
                    <img
                      src={user.profile_picture}
                      alt={user.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('❌ Sidebar profile picture failed to load:', user.profile_picture)
                        // Hide the image and show initials
                        const imgElement = e.currentTarget as HTMLImageElement
                        const container = imgElement.parentElement
                        if (container) {
                          imgElement.style.display = 'none'
                          const fallbackDiv = container.querySelector('.sidebar-user-initials') as HTMLElement
                          if (fallbackDiv) {
                            fallbackDiv.style.display = 'flex'
                          }
                        }
                      }}
                      onLoad={(e) => {
                        console.log('✅ Sidebar profile picture loaded successfully:', user.profile_picture)
                        // Hide initials when image loads
                        const imgElement = e.currentTarget as HTMLImageElement
                        const container = imgElement.parentElement
                        if (container) {
                          const fallbackDiv = container.querySelector('.sidebar-user-initials') as HTMLElement
                          if (fallbackDiv) {
                            fallbackDiv.style.display = 'none'
                          }
                        }
                      }}
                    />
                    <div
                      className="sidebar-user-initials w-full h-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ display: 'none' }}
                    >
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </>
                ) : (
                  <div
                    className="sidebar-user-initials w-full h-full flex items-center justify-center text-white font-bold text-lg"
                  >
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{user?.username}</h2>
                {user?.is_premium ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-600 dark:text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                    <Crown className="w-3 h-3" />
                    Pro
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 bg-gray-200/80 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs rounded-full border border-gray-300 dark:border-gray-600">
                    Free
                  </span>
                )}
              </div>
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeSection === 'overview'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  Overview
                </button>

                <button
                  onClick={() => {
                    console.log('🔄 Manually loading saved content')
                    setActiveSection('content')
                    // Load immediately without delay
                    loadSectionData('content')
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeSection === 'content'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <Save className="w-5 h-5" />
                  Saved Content
                  {savedContent.length > 0 && (
                    <span className="ml-auto px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                      {savedContent.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    console.log('🔄 Manually loading content history')
                    setActiveSection('history')
                    // Load immediately without delay
                    loadSectionData('history')
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeSection === 'history'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <History className="w-5 h-5" />
                  History
                  {contentHistory.length > 0 && (
                    <span className="ml-auto px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                      {contentHistory.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveSection('templates')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeSection === 'templates'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <FileText className="w-5 h-5" />
                  Templates
                  {user?.is_premium && (
                    <Crown className="w-3 h-3 ml-auto text-yellow-600 dark:text-yellow-500 dark:text-yellow-400" />
                  )}
                </button>

                <button
                  onClick={() => setActiveSection('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeSection === 'settings'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
              </div>
            </nav>

            {/* Logout Button */}
            <button
              onClick={() => {
                logout()
                onClose()
              }}
              className="flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all duration-200 mt-4 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 shadow-sm hover:shadow-md"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>

          {/* Main Content Area - Responsive Layout */}
          <div className="flex-1 flex flex-col min-h-0 hide-scrollbar">
            {/* Header - Hidden on mobile since we have tab navigation */}
            <div className="hidden sm:flex items-center justify-between p-8 border-b border-gray-200/50 dark:border-slate-700/50">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeSection === 'overview' && 'Dashboard Overview'}
                {activeSection === 'content' && (
                  <span className="flex items-center gap-2">
                    Saved Content
                    {savedContent.length > 0 && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm rounded-full">
                        {getFilteredContent().length} {getFilteredContent().length !== savedContent.length && `of ${savedContent.length}`}
                      </span>
                    )}
                  </span>
                )}
                {activeSection === 'history' && (
                  <span className="flex items-center gap-2">
                    Content History
                    {contentHistory.length > 0 && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-600 dark:text-purple-400 text-sm rounded-full">
                        {contentHistory.length}
                      </span>
                    )}
                  </span>
                )}
                {activeSection === 'templates' && 'Custom Templates'}
                {activeSection === 'settings' && 'Account Settings'}
              </h1>
              <div className="flex items-center gap-3">
                {/* Refresh Stats/Data Button */}
                {(activeSection === 'overview' || activeSection === 'content' || activeSection === 'history') && (
                  <button
                    onClick={() => {
                      if (activeSection === 'overview') {
                        loadInitialDataFast()
                      } else {
                        // Invalidate cache and reload
                        const cacheKeys: { [key: string]: string } = {
                          'content': `dashboard-saved-content-${user?.id}`,
                          'history': `dashboard-content-history-${user?.id}`
                        }

                        const key = cacheKeys[activeSection]
                        if (key) {
                          requestCache.invalidate(key)
                          // Clear current data to show loading state
                          if (activeSection === 'content') {
                            setSavedContent([])
                            setIsLoadingContent(true)
                          }
                          if (activeSection === 'history') {
                            setContentHistory([])
                            setIsLoadingHistory(true)
                          }
                          loadSectionData(activeSection)
                        }
                      }
                    }}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                    title="Refresh data"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className="flex-1 overflow-y-auto p-4 sm:p-8 min-h-0 hide-scrollbar"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
              }}
            >
              {activeSection === 'overview' && (
                <div className="space-y-8">
                  {/* Usage Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500/15 to-cyan-500/15 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generations</h3>
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        {usageStats?.total_generations || 0}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Total content generated</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/15 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Saved Items</h3>
                        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                          <Save className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                        {savedContent.length}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Content pieces saved</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500/15 to-pink-500/15 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plan Status</h3>
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-2">
                        {user?.is_premium ? 'Pro Member' : 'Free Plan'}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {user?.is_premium ? 'Unlimited generations' : `${usageStats?.remaining_requests || 0} generations left`}
                      </p>
                    </div>
                  </div>

                  {/* Subscription Management */}
                  {user?.is_premium && (
                    <div className="bg-gradient-to-br from-yellow-500/15 to-orange-500/15 dark:from-yellow-500/20 dark:to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            Pro Subscription
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">Manage your subscription settings</p>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-600 dark:text-yellow-400 font-semibold">Active</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">Unlimited access</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-600 dark:text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-500/30 rounded-lg font-medium transition-all duration-200"
                      >
                        Cancel Plan
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'content' && (
                <div className="space-y-6">
                  {!user?.is_premium ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-yellow-600 dark:text-yellow-500 dark:text-yellow-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Premium Feature</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Save and organize your generated content with Pro membership
                      </p>
                      <button
                        onClick={() => router.push('/pricing')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200"
                      >
                        Upgrade to Pro
                      </button>
                    </div>
                  ) : isLoadingContent ? (
                    <div className="text-center py-12">
                      <LoadingSpinner />
                      <p className="text-gray-600 dark:text-gray-300 mt-4">Loading saved content...</p>
                    </div>
                  ) : savedContent.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Save className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Saved Content</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Start generating content and save your favorites here
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Search and Filter */}
                      <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Search saved content..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                          />
                        </div>
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="px-4 py-2 bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700/50 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                        >
                          <option value="all">All Types</option>
                          <option value="auto-generated">Auto-generated</option>
                          <option value="twitter">Twitter Thread</option>
                          <option value="linkedin">LinkedIn Post</option>
                          <option value="instagram">Instagram Carousel</option>
                        </select>
                      </div>

                      {/* Content List */}
                      <div className="space-y-4">
                        {/* Bulk Export Options - Only for Pro users */}
                        {user?.is_premium && savedContent.length > 0 && (
                          <div className="bg-gray-100/50 dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700/30 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-gray-900 dark:text-white font-medium mb-1">Bulk Export</h4>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Export all {savedContent.length} saved items</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleBulkExport('txt')}
                                  className="px-3 py-2 bg-blue-600/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 shadow-sm"
                                >
                                  <FileText className="w-3 h-3" />
                                  TXT
                                </button>
                                <button
                                  onClick={() => handleBulkExport('json')}
                                  className="px-3 py-2 bg-green-600/20 text-green-700 dark:text-green-400 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 shadow-sm"
                                >
                                  <Download className="w-3 h-3" />
                                  JSON
                                </button>
                                <button
                                  onClick={() => handleBulkExport('csv')}
                                  className="px-3 py-2 bg-purple-600/20 text-purple-700 dark:text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 shadow-sm"
                                >
                                  <Download className="w-3 h-3" />
                                  CSV
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {getPaginatedContent().map((item) => (
                          <div key={item.id} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-xs">
                                    {item.content_type === 'auto-generated' ? 'Auto-saved' :
                                      item.content_type === 'twitter' ? 'Twitter Thread' :
                                        item.content_type === 'linkedin' ? 'LinkedIn Post' :
                                          item.content_type === 'instagram' ? 'Instagram Carousel' :
                                            item.content_type}
                                  </span>
                                  <span className="text-gray-400 text-sm">
                                    {new Date(item.created_at).toLocaleDateString()}
                                  </span>
                                  {item.is_favorite && (
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setViewingContent(item)}
                                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                                  title="View content"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Export Dropdown - Pro only */}
                                {user?.is_premium && (
                                  <div className="relative group">
                                    <button
                                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                                      title="Export content"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[120px]">
                                      <button
                                        onClick={() => handleExportContent(item, 'txt')}
                                        className="w-full px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-t-lg transition-colors text-sm flex items-center gap-2"
                                      >
                                        <FileText className="w-3 h-3" />
                                        Export TXT
                                      </button>
                                      <button
                                        onClick={() => handleExportContent(item, 'json')}
                                        className="w-full px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-sm flex items-center gap-2"
                                      >
                                        <Download className="w-3 h-3" />
                                        Export JSON
                                      </button>
                                      <button
                                        onClick={() => handleExportContent(item, 'csv')}
                                        className="w-full px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-b-lg transition-colors text-sm flex items-center gap-2"
                                      >
                                        <Download className="w-3 h-3" />
                                        Export CSV
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <button
                                  onClick={() => handleToggleFavorite(item.id)}
                                  className={`p-2 rounded-lg transition-all duration-200 ${item.is_favorite
                                    ? 'text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-500/10'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-slate-700/50'
                                    }`}
                                  title={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                  <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  onClick={() => setDeletingContent(item)}
                                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                  title="Delete content"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                              {item.content.substring(0, 200)}...
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {getTotalPages() > 1 && (
                        <Pagination
                          currentPage={currentPage}
                          totalPages={getTotalPages()}
                          onPageChange={setCurrentPage}
                          itemsPerPage={itemsPerPage}
                          totalItems={getFilteredContent().length}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {activeSection === 'history' && (
                <div className="space-y-6">
                  {isLoadingHistory ? (
                    <div className="text-center py-12">
                      <LoadingSpinner />
                      <p className="text-gray-600 dark:text-gray-300 mt-4">Loading content history...</p>
                    </div>
                  ) : contentHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No History</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Your content generation history will appear here
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* History List */}
                      <div className="space-y-4">
                        {getPaginatedHistory().map((item) => (
                          <div key={item.id} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-gray-400 text-sm">
                                    {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                                  </span>
                                  {item.processing_time && (
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full text-xs">
                                      {item.processing_time}s
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                                  <strong>Original:</strong> {item.original_content.substring(0, 100)}...
                                </p>
                                <div className="space-y-2">
                                  {item.twitter_thread && (
                                    <div>
                                      <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">Twitter Thread:</span>
                                      <p className="text-gray-600 dark:text-gray-300 text-sm ml-4">{item.twitter_thread.substring(0, 150)}...</p>
                                    </div>
                                  )}
                                  {item.linkedin_post && (
                                    <div>
                                      <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">LinkedIn Post:</span>
                                      <p className="text-gray-600 dark:text-gray-300 text-sm ml-4">{item.linkedin_post.substring(0, 150)}...</p>
                                    </div>
                                  )}
                                  {item.instagram_carousel && (
                                    <div>
                                      <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">Instagram Carousel:</span>
                                      <p className="text-gray-600 dark:text-gray-300 text-sm ml-4">{item.instagram_carousel.substring(0, 150)}...</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {getHistoryTotalPages() > 1 && (
                        <Pagination
                          currentPage={historyPage}
                          totalPages={getHistoryTotalPages()}
                          onPageChange={setHistoryPage}
                          itemsPerPage={historyPerPage}
                          totalItems={contentHistory.length}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {activeSection === 'templates' && (
                <div>
                  {!user?.is_premium ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Premium Feature</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Create and manage custom templates with Pro membership
                      </p>
                      <button
                        onClick={() => router.push('/pricing')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200"
                      >
                        Upgrade to Pro
                      </button>
                    </div>
                  ) : (
                    <CustomTemplateManager />
                  )}
                </div>
              )}

              {activeSection === 'settings' && (
                <div className="space-y-8">
                  {/* Account Information */}
                  <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Information</h3>
                      {!isEditingProfile ? (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleUpdateProfile}
                            disabled={isSavingProfile}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-all duration-200"
                          >
                            <Check className="w-4 h-4" />
                            {isSavingProfile ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSavingProfile}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-6">
                      {/* Profile Picture Section - Instagram Style */}
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            {(() => {
                              console.log('🖼️ Profile picture check:', {
                                hasProfilePicture: !!user?.profile_picture,
                                profilePictureLength: user?.profile_picture?.length,
                                isValidUrl: user?.profile_picture ? isValidImageUrl(user.profile_picture) : false,
                                profilePicturePreview: user?.profile_picture?.substring(0, 50) + '...'
                              })
                              return user?.profile_picture && isValidImageUrl(user.profile_picture)
                            })() ? (
                              <>
                                <img
                                  src={user.profile_picture}
                                  alt={user.username}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.log('❌ Profile picture failed to load:', user.profile_picture?.substring(0, 100))
                                    console.log('❌ Error details:', e)
                                    // Hide the image and show initials
                                    const imgElement = e.currentTarget as HTMLImageElement
                                    const container = imgElement.parentElement
                                    if (container) {
                                      imgElement.style.display = 'none'
                                      const fallbackDiv = container.querySelector('.profile-initials') as HTMLElement
                                      if (fallbackDiv) {
                                        fallbackDiv.style.display = 'flex'
                                      }
                                    }
                                  }}
                                  onLoad={(e) => {
                                    console.log('✅ Profile picture loaded successfully in settings')
                                    // Hide initials when image loads
                                    const imgElement = e.currentTarget as HTMLImageElement
                                    const container = imgElement.parentElement
                                    if (container) {
                                      const fallbackDiv = container.querySelector('.profile-initials') as HTMLElement
                                      if (fallbackDiv) {
                                        fallbackDiv.style.display = 'none'
                                      }
                                    }
                                  }}
                                />
                                <div
                                  className="profile-initials w-full h-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl"
                                  style={{ display: 'none' }}
                                >
                                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              </>
                            ) : (
                              <div
                                className="profile-initials w-full h-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl"
                              >
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          {isEditingProfile && (
                            <button
                              onClick={() => {
                                setShowProfilePictureModal(true)
                                setSelectedFile(null)
                                setPreviewUrl('')
                              }}
                              className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                              title="Change profile picture"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{user?.username}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user?.full_name || 'Add your full name'}
                          </p>
                          {!isEditingProfile && (
                            <button
                              onClick={() => setIsEditingProfile(true)}
                              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                            >
                              Edit profile
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={editedUsername}
                              onChange={(e) => setEditedUsername(e.target.value)}
                              className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter username"
                            />
                          ) : (
                            <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white">
                              {user?.username}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={editedFullName}
                              onChange={(e) => setEditedFullName(e.target.value)}
                              className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter full name (optional)"
                            />
                          ) : (
                            <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white">
                              {user?.full_name || 'Not set'}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                          <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white">
                            {user?.email}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-white">Auto-save content</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {user?.is_premium
                              ? 'Automatically save generated content'
                              : 'Upgrade to Pro to automatically save content'
                            }
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (!user?.is_premium) {
                              toast.error('🔒 Auto-save is available for Pro users only!')
                              return
                            }
                            setAutoSaveEnabled(!autoSaveEnabled)
                          }}
                          disabled={!user?.is_premium}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${!user?.is_premium
                            ? 'bg-gray-400 cursor-not-allowed opacity-50'
                            : autoSaveEnabled ? 'bg-blue-600' : 'bg-gray-600'
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user?.is_premium && autoSaveEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-white">Email notifications</label>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Receive updates and notifications</p>
                        </div>
                        <button
                          onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-600'
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Content Modal */}
      {viewingContent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{viewingContent.title}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFavorite(viewingContent.id)}
                    className={`p-2 rounded-lg transition-colors ${viewingContent.is_favorite
                      ? 'text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-500/10'
                      : 'text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-700/50'
                      }`}
                    title={viewingContent.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-5 h-5 ${viewingContent.is_favorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => setViewingContent(null)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-xs">
                  {viewingContent.content_type === 'auto-generated' ? 'Auto-saved' :
                    viewingContent.content_type === 'twitter' ? 'Twitter Thread' :
                      viewingContent.content_type === 'linkedin' ? 'LinkedIn Post' :
                        viewingContent.content_type === 'instagram' ? 'Instagram Carousel' :
                          viewingContent.content_type}
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {new Date(viewingContent.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-96 bg-gray-50 dark:bg-gray-900/50">
              <pre className="text-gray-800 dark:text-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {viewingContent.content}
              </pre>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-wrap gap-2 items-center justify-start">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingContent.content)
                    toast.success('Content copied to clipboard!')
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 text-sm shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Content
                </button>

                {/* Export Options - Pro only */}
                {user?.is_premium && (
                  <>
                    <button
                      onClick={() => handleExportContent(viewingContent, 'txt')}
                      className="px-3 py-1.5 bg-green-600/20 text-green-600 dark:text-green-400 hover:bg-green-600/30 border border-green-500/30 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 text-sm shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Export TXT
                    </button>
                    <button
                      onClick={() => handleExportContent(viewingContent, 'json')}
                      className="px-3 py-1.5 bg-purple-600/20 text-purple-600 dark:text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 text-sm shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export JSON
                    </button>
                    <button
                      onClick={() => handleExportContent(viewingContent, 'csv')}
                      className="px-3 py-1.5 bg-orange-600/20 text-orange-600 dark:text-orange-400 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5 text-sm shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Content Modal */}
      {deletingContent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div className="bg-white dark:bg-slate-900/95 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Content</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete "{deletingContent.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteContent(deletingContent.id)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingContent(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Modal */}
      {showProfilePictureModal && !showImageEditor && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div className="bg-white dark:bg-slate-900/95 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Change Profile Picture</h3>
              <button
                onClick={() => {
                  setShowProfilePictureModal(false)
                  setSelectedFile(null)
                  setPreviewUrl('')
                }}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Image</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="profile-picture-upload"
                  />
                  <label
                    htmlFor="profile-picture-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </label>
                </div>
                {selectedFile && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      📸 {selectedFile.name}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Ready to adjust and crop your photo
                    </p>
                  </div>
                )}
              </div>

              {/* Current Preview */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  {editedProfilePicture && isValidImageUrl(editedProfilePicture) ? (
                    <>
                      <img
                        src={editedProfilePicture}
                        alt="Current"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const imgElement = e.currentTarget as HTMLImageElement
                          const container = imgElement.parentElement
                          if (container) {
                            imgElement.style.display = 'none'
                            const fallbackDiv = container.querySelector('.current-initials') as HTMLElement
                            if (fallbackDiv) {
                              fallbackDiv.style.display = 'flex'
                            }
                          }
                        }}
                        onLoad={(e) => {
                          const imgElement = e.currentTarget as HTMLImageElement
                          const container = imgElement.parentElement
                          if (container) {
                            const fallbackDiv = container.querySelector('.current-initials') as HTMLElement
                            if (fallbackDiv) {
                              fallbackDiv.style.display = 'none'
                            }
                          }
                        }}
                      />
                      <div
                        className="current-initials w-full h-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ display: 'none' }}
                      >
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </>
                  ) : (
                    <div
                      className="current-initials w-full h-full flex items-center justify-center text-white font-bold text-lg"
                    >
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Current Photo</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {editedProfilePicture && isValidImageUrl(editedProfilePicture) ? 'Custom image' : 'Default initials'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setEditedProfilePicture('')
                    setSelectedFile(null)
                    setPreviewUrl('')
                    setShowProfilePictureModal(false)
                    // Save the removal
                    handleImageUpload('')
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg font-medium transition-all duration-200"
                >
                  Remove Photo
                </button>
                <button
                  onClick={() => setShowProfilePictureModal(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      <ImageEditor
        imageUrl={previewUrl}
        isOpen={showImageEditor}
        onSave={handleImageCrop}
        onCancel={() => {
          setShowImageEditor(false)
          setSelectedFile(null)
          setPreviewUrl('')
        }}
      />

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div className="bg-white dark:bg-slate-900/95 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cancel Subscription</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to cancel your Pro subscription? You'll lose access to premium features.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-all duration-200"
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg font-medium transition-all duration-200"
              >
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  return createPortal(modalElement, document.body)
}