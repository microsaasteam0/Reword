'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, RotateCw, ZoomIn, ZoomOut, Check } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface ImageEditorProps {
  imageUrl: string
  onSave: (canvas: HTMLCanvasElement) => void
  onCancel: () => void
  isOpen: boolean
}

export default function ImageEditor({ imageUrl, onSave, onCancel, isOpen }: ImageEditorProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  
  // Only log when the modal state actually changes
  const prevIsOpen = useRef(isOpen)
  useEffect(() => {
    if (prevIsOpen.current !== isOpen) {
      console.log('🎨 ImageEditor state changed:', isOpen ? 'opened' : 'closed')
      prevIsOpen.current = isOpen
    }
  }, [isOpen])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  // Initialize image when modal opens
  useEffect(() => {
    if (!isOpen || !imageUrl) {
      return
    }

    console.log('🔄 Loading image:', imageUrl.substring(0, 50) + '...')
    setIsLoading(true)
    setError(null)

    const img = new Image()
    
    img.onload = () => {
      console.log('✅ Image loaded:', img.width, 'x', img.height)
      setImage(img)
      
      // Initialize canvas
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = 400
        canvas.height = 400
        
        // Calculate initial scale and position
        const scaleX = canvas.width / img.width
        const scaleY = canvas.height / img.height
        const initialScale = Math.min(scaleX, scaleY) * 0.6 // Reduced from 0.7 to 0.6 for maximum face fitting room
        
        setScale(initialScale)
        setPosition({
          x: (canvas.width - img.width * initialScale) / 2,
          y: (canvas.height - img.height * initialScale) / 2
        })
      }
      
      setIsLoading(false)
    }
    
    img.onerror = () => {
      console.error('❌ Failed to load image')
      setError('Failed to load image. Please try again.')
      setIsLoading(false)
    }
    
    img.src = imageUrl
  }, [isOpen, imageUrl])

  // Draw canvas when image or transformations change
  useEffect(() => {
    if (!image || isLoading) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Save context
    ctx.save()
    
    // Apply transformations
    const centerX = position.x + (image.width * scale) / 2
    const centerY = position.y + (image.height * scale) / 2
    
    ctx.translate(centerX, centerY)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale, scale)
    ctx.translate(-image.width / 2, -image.height / 2)
    
    // Draw image
    ctx.drawImage(image, 0, 0)
    
    // Restore context
    ctx.restore()
    
    // Draw crop overlay
    drawCropOverlay(ctx)
  }, [image, position, scale, rotation, isLoading, isDark]) // Added isDark dependency

  const drawCropOverlay = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const cropSize = Math.min(canvas.width, canvas.height) * 0.95 // Increased from 0.9 to 0.95 for maximum face area
    const cropX = (canvas.width - cropSize) / 2
    const cropY = (canvas.height - cropSize) / 2
    
    // Semi-transparent overlay - adjust opacity based on theme
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Clear crop area
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillRect(cropX, cropY, cropSize, cropSize)
    ctx.globalCompositeOperation = 'source-over'
    
    // Crop border - adjust color based on theme
    ctx.strokeStyle = isDark ? '#60a5fa' : '#2563eb'
    ctx.lineWidth = 3
    ctx.strokeRect(cropX, cropY, cropSize, cropSize)
    
    // Add corner indicators for better visibility
    const cornerSize = 20
    const cornerThickness = 3
    ctx.strokeStyle = isDark ? '#60a5fa' : '#2563eb'
    ctx.lineWidth = cornerThickness
    
    // Top-left corner
    ctx.beginPath()
    ctx.moveTo(cropX, cropY + cornerSize)
    ctx.lineTo(cropX, cropY)
    ctx.lineTo(cropX + cornerSize, cropY)
    ctx.stroke()
    
    // Top-right corner
    ctx.beginPath()
    ctx.moveTo(cropX + cropSize - cornerSize, cropY)
    ctx.lineTo(cropX + cropSize, cropY)
    ctx.lineTo(cropX + cropSize, cropY + cornerSize)
    ctx.stroke()
    
    // Bottom-left corner
    ctx.beginPath()
    ctx.moveTo(cropX, cropY + cropSize - cornerSize)
    ctx.lineTo(cropX, cropY + cropSize)
    ctx.lineTo(cropX + cornerSize, cropY + cropSize)
    ctx.stroke()
    
    // Bottom-right corner
    ctx.beginPath()
    ctx.moveTo(cropX + cropSize - cornerSize, cropY + cropSize)
    ctx.lineTo(cropX + cropSize, cropY + cropSize)
    ctx.lineTo(cropX + cropSize, cropY + cropSize - cornerSize)
    ctx.stroke()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setIsDragging(true)
    setDragStart({ x: x - position.x, y: y - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setPosition({
      x: x - dragStart.x,
      y: y - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleSave = () => {
    if (!image) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Create result canvas
    const resultCanvas = document.createElement('canvas')
    const resultCtx = resultCanvas.getContext('2d')
    if (!resultCtx) return
    
    const size = 300
    resultCanvas.width = size
    resultCanvas.height = size
    
    const cropSize = Math.min(canvas.width, canvas.height) * 0.95 // Updated to match crop overlay
    const cropX = (canvas.width - cropSize) / 2
    const cropY = (canvas.height - cropSize) / 2
    const scaleRatio = size / cropSize
    
    resultCtx.save()
    resultCtx.scale(scaleRatio, scaleRatio)
    resultCtx.translate(-cropX, -cropY)
    
    const centerX = position.x + (image.width * scale) / 2
    const centerY = position.y + (image.height * scale) / 2
    
    resultCtx.translate(centerX, centerY)
    resultCtx.rotate((rotation * Math.PI) / 180)
    resultCtx.scale(scale, scale)
    resultCtx.translate(-image.width / 2, -image.height / 2)
    
    resultCtx.drawImage(image, 0, 0)
    resultCtx.restore()
    
    onSave(resultCanvas)
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(true)
      setError(null)
      setImage(null)
      setScale(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
      setIsDragging(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-[10002] ${
      isDark ? 'bg-black/90' : 'bg-white/90'
    }`}>
      <div className={`rounded-2xl border-2 max-w-2xl w-full shadow-2xl ${
        isDark 
          ? 'bg-gray-900 border-blue-600' 
          : 'bg-white border-blue-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b-2 ${
          isDark 
            ? 'border-blue-700 bg-blue-900/20' 
            : 'border-blue-100 bg-blue-50'
        }`}>
          <h3 className={`text-xl font-bold ${
            isDark ? 'text-blue-300' : 'text-blue-900'
          }`}>
            🎨 Adjust Your Photo - {isDark ? 'Dark' : 'Light'} Theme
          </h3>
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-800/50' 
                : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className={`p-6 ${
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-blue-900/20' 
            : 'bg-gradient-to-br from-gray-50 to-blue-50'
        }`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className={`w-8 h-8 border-4 rounded-full animate-spin mx-auto mb-4 ${
                  isDark 
                    ? 'border-blue-700 border-t-blue-400' 
                    : 'border-blue-200 border-t-blue-600'
                }`}></div>
                <p className={`font-medium ${
                  isDark ? 'text-blue-300' : 'text-blue-800'
                }`}>Loading image...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className={`w-16 h-16 border-2 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDark 
                    ? 'bg-red-900/20 border-red-700' 
                    : 'bg-red-100 border-red-200'
                }`}>
                  <X className={`w-8 h-8 ${
                    isDark ? 'text-red-400' : 'text-red-600'
                  }`} />
                </div>
                <p className={`font-medium mb-4 ${
                  isDark ? 'text-red-400' : 'text-red-700'
                }`}>{error}</p>
                <button
                  onClick={onCancel}
                  className={`px-6 py-3 rounded-lg transition-colors border ${
                    isDark 
                      ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400 border-red-700' 
                      : 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className={`relative border-4 rounded-2xl overflow-hidden shadow-lg p-2 ${
                isDark 
                  ? 'border-blue-600 bg-gray-800' 
                  : 'border-blue-300 bg-white'
              }`}>
                <canvas
                  ref={canvasRef}
                  className="cursor-move rounded-lg"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
              
              <div className={`text-center rounded-lg p-4 border shadow-sm ${
                isDark 
                  ? 'bg-gray-800 border-blue-700' 
                  : 'bg-white border-blue-200'
              }`}>
                <p className={`text-sm font-medium ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  🖱️ Drag to reposition • 🎛️ Use controls below to adjust • 🔵 Blue square shows final crop area
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {!isLoading && !error && (
          <div className={`p-6 border-t-2 ${
            isDark 
              ? 'border-blue-700 bg-gray-900' 
              : 'border-blue-100 bg-white'
          }`}>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              {/* Zoom Controls */}
              <div className={`flex items-center gap-2 rounded-xl p-2 border ${
                isDark 
                  ? 'bg-blue-900/20 border-blue-700' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <button
                  onClick={() => handleZoom(-0.1)}
                  className={`p-3 rounded-lg transition-colors shadow-sm border-2 font-bold ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 text-blue-400 border-blue-600' 
                      : 'bg-white hover:bg-blue-100 text-blue-700 border-blue-300'
                  }`}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className={`text-sm font-bold min-w-[70px] text-center px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'text-blue-300 bg-gray-800 border-blue-700' 
                    : 'text-blue-800 bg-white border-blue-200'
                }`}>
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => handleZoom(0.1)}
                  className={`p-3 rounded-lg transition-colors shadow-sm border-2 font-bold ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 text-blue-400 border-blue-600' 
                      : 'bg-white hover:bg-blue-100 text-blue-700 border-blue-300'
                  }`}
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              {/* Rotate */}
              <button
                onClick={handleRotate}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-colors border-2 font-bold shadow-sm ${
                  isDark 
                    ? 'bg-blue-900/20 hover:bg-blue-900/40 text-blue-300 border-blue-600' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300'
                }`}
                title="Rotate 90°"
              >
                <RotateCw className="w-5 h-5" />
                Rotate 90°
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={onCancel}
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 border-2 ${
                  isDark 
                    ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-800 border-gray-600 bg-gray-800/50' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300 bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg border-2 ${
                  isDark 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-blue-500' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-blue-500'
                }`}
              >
                <Check className="w-5 h-5" />
                ✨ Apply Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}