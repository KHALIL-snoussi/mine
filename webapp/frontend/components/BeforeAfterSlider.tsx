'use client'

import { useState, useEffect } from 'react'
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider'
import {
  generatePaintPreview,
  estimatePaintingSize,
  getQualityPreset,
  type PreviewOptions
} from '@/lib/previewGenerator'

interface BeforeAfterSliderProps {
  originalImage: string
  palette: {
    name: string
    colors: number[][]
  }
  model: string  // 'original', 'vintage', 'pop_art', 'full_color_hd'
  className?: string
}

type QualityLevel = 'low' | 'medium' | 'high' | 'ultra'

export default function BeforeAfterSlider({
  originalImage,
  palette,
  model,
  className = '',
}: BeforeAfterSliderProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quality, setQuality] = useState<QualityLevel>('medium')
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

  // Get image dimensions
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height })
    }
    img.src = originalImage
  }, [originalImage])

  // Generate preview when image, palette, model, or quality changes
  useEffect(() => {
    const generatePreview = async () => {
      setIsGenerating(true)
      setError(null)
      setPreviewImage(null)

      try {
        const options: PreviewOptions = { quality, model }
        const preview = await generatePaintPreview(originalImage, palette, options)
        setPreviewImage(preview)
      } catch (err) {
        console.error('Error generating preview:', err)
        setError('Failed to generate preview. Try a different quality setting.')
      } finally {
        setIsGenerating(false)
      }
    }

    generatePreview()
  }, [originalImage, palette, model, quality])

  const retryGeneration = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const options: PreviewOptions = { quality, model }
      const preview = await generatePaintPreview(originalImage, palette, options)
      setPreviewImage(preview)
    } catch (err) {
      console.error('Error generating preview:', err)
      setError('Failed to generate preview. Try a different quality setting.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Get quality preset info
  const preset = getQualityPreset(quality)
  const outputSize = preset.maxSize

  // Calculate painting size
  const paintingSize = estimatePaintingSize(outputSize)

  // Quality descriptions
  const qualityInfo = {
    low: { label: 'Fast Preview', emoji: '⚡', desc: 'Quick generation, suitable for checking composition' },
    medium: { label: 'Balanced', emoji: '⚖️', desc: 'Good quality with fast generation (recommended)' },
    high: { label: 'High Quality', emoji: '✨', desc: 'Better detail, smoother edges, slightly slower' },
    ultra: { label: 'Maximum Quality', emoji: '💎', desc: 'Best possible quality, takes longer' },
  }

  if (isGenerating) {
    return (
      <div className={`space-y-5 ${className}`}>
        {/* Header Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            ✨ Paint-by-Numbers Preview
          </h3>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            Generating your preview with {qualityInfo[quality].label} quality...
          </p>
        </div>

        {/* Quality Selector - Always visible */}
        <QualitySelector
          quality={quality}
          setQuality={setQuality}
          qualityInfo={qualityInfo}
          disabled={isGenerating}
        />

        {/* Loading State */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 shadow-lg">
          <div className="flex min-h-[400px] items-center justify-center p-8">
            <div className="text-center max-w-md">
              {/* Animated spinner */}
              <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>

              {/* Progress message */}
              <p className="text-lg font-bold text-slate-800 mb-2">
                Creating Your Preview...
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Applying {qualityInfo[quality].emoji} {qualityInfo[quality].label} settings
              </p>

              {/* Progress steps */}
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Processing image...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-100"></div>
                  <span>Applying paint effects...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
                  <span>Adding details...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !previewImage) {
    return (
      <div className={`space-y-5 ${className}`}>
        {/* Header Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            ✨ Paint-by-Numbers Preview
          </h3>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            Something went wrong. Let's try again!
          </p>
        </div>

        {/* Quality Selector */}
        <QualitySelector
          quality={quality}
          setQuality={setQuality}
          qualityInfo={qualityInfo}
          disabled={isGenerating}
        />

        {/* Error State */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 shadow-lg">
          <div className="flex min-h-[400px] items-center justify-center p-8">
            <div className="text-center max-w-md">
              {/* Error icon */}
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              {/* Error message */}
              <p className="text-lg font-bold text-slate-800 mb-2">
                Preview Generation Failed
              </p>
              <p className="text-sm text-slate-600 mb-6">
                {error || 'Preview not available. This might be due to image size or format.'}
              </p>

              {/* Suggestions */}
              <div className="mb-6 p-4 bg-white rounded-lg text-left text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-800 mb-2">💡 Suggestions:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Try a lower quality setting (Fast or Balanced)</li>
                  <li>Make sure your image is a valid format (JPG, PNG)</li>
                  <li>Check your internet connection</li>
                </ul>
              </div>

              {/* Retry button */}
              <button
                onClick={retryGeneration}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold transition-all hover:shadow-lg hover:scale-105"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header Section */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          ✨ Paint-by-Numbers Preview
        </h3>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto">
          See exactly how your painting will look! Drag the slider to compare, and adjust quality to control the final size.
        </p>
      </div>

      {/* Quality Selector */}
      <QualitySelector
        quality={quality}
        setQuality={setQuality}
        qualityInfo={qualityInfo}
        disabled={isGenerating}
      />

      {/* Size Info Card - More Prominent */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-300 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-base font-bold text-slate-900 mb-1">
              📐 Your Painting Size
            </p>
            <p className="text-xs text-slate-600">
              At {outputSize}px × 150 DPI print quality
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-black bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                {paintingSize.inches}"
              </p>
              <p className="text-xs text-slate-500 font-medium">
                inches
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                {paintingSize.cm}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                centimeters
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slider Component */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-2 ring-slate-200">
        <div style={{ height: '500px' }}>
          <ReactCompareSlider
            itemOne={
              <ReactCompareSliderImage
                src={originalImage}
                alt="Original Photo"
                style={{ objectFit: 'contain', backgroundColor: '#f8fafc' }}
              />
            }
            itemTwo={
              <ReactCompareSliderImage
                src={previewImage}
                alt="Paint-by-Numbers Preview"
                style={{ objectFit: 'contain', backgroundColor: '#f8fafc' }}
              />
            }
            position={50}
            style={{
              height: '100%',
              width: '100%',
            }}
          />

          {/* Labels */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4">
            <div className="rounded-lg bg-black/70 px-4 py-2 backdrop-blur-sm shadow-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-white">📸 Original</p>
            </div>
            <div className="rounded-lg bg-gradient-to-r from-primary-600/90 to-secondary-600/90 px-4 py-2 backdrop-blur-sm shadow-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                {qualityInfo[quality].emoji} Preview
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
            <div className="mx-auto max-w-md rounded-lg bg-black/70 px-5 py-3 text-center backdrop-blur-sm shadow-lg">
              <p className="text-sm font-semibold text-white">
                👆 <span className="font-bold">Drag the slider</span> to compare
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Info */}
      <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-5 border-2 border-amber-200 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="text-3xl flex-shrink-0">💡</span>
          <div className="flex-1">
            <p className="text-base font-bold text-slate-900 mb-2">
              About This Preview
            </p>
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold flex-shrink-0">•</span>
                <span>This is a <strong>simulated preview</strong> showing how your paint-by-numbers will look</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold flex-shrink-0">•</span>
                <span>Your final template includes <strong>numbered regions</strong>, detailed color legend, and painting guide</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold flex-shrink-0">•</span>
                <span>Choose <strong>higher quality</strong> for larger paintings or more intricate details</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Separate component for quality selector
function QualitySelector({
  quality,
  setQuality,
  qualityInfo,
  disabled,
}: {
  quality: QualityLevel
  setQuality: (q: QualityLevel) => void
  qualityInfo: Record<QualityLevel, { label: string; emoji: string; desc: string }>
  disabled: boolean
}) {
  const qualities: QualityLevel[] = ['low', 'medium', 'high', 'ultra']

  return (
    <div className="rounded-xl bg-white border-2 border-slate-200 p-5 shadow-sm">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-900 mb-2">
          🎨 Choose Your Preview Quality
        </h4>
        <p className="text-sm text-slate-600 leading-relaxed">
          {qualityInfo[quality].desc}
        </p>
      </div>

      {/* Quality Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {qualities.map((q) => {
          const preset = getQualityPreset(q)
          const isSelected = quality === q

          return (
            <button
              key={q}
              onClick={() => setQuality(q)}
              disabled={disabled}
              className={`
                relative px-4 py-4 rounded-xl text-sm font-semibold transition-all transform
                ${isSelected
                  ? 'bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-xl scale-105 ring-2 ring-primary-300'
                  : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-102 shadow-sm'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
              `}
            >
              {/* Emoji */}
              <span className="block text-2xl mb-1.5">{qualityInfo[q].emoji}</span>

              {/* Label */}
              <span className="block text-sm font-bold mb-0.5">
                {q === 'low' && 'Fast'}
                {q === 'medium' && 'Balanced'}
                {q === 'high' && 'High'}
                {q === 'ultra' && 'Ultra'}
              </span>

              {/* Size */}
              <span className={`block text-xs ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                {preset.maxSize}px
              </span>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Speed/Quality indicators */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span className="font-medium">Faster</span>
          </div>
          <div className="flex-1 mx-3">
            <div className="h-1 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full"></div>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Better Quality</span>
            <span>✨</span>
          </div>
        </div>
      </div>
    </div>
  )
}
