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
  className?: string
}

type QualityLevel = 'low' | 'medium' | 'high' | 'ultra'

export default function BeforeAfterSlider({
  originalImage,
  palette,
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

  // Generate preview when image, palette, or quality changes
  useEffect(() => {
    const generatePreview = async () => {
      setIsGenerating(true)
      setError(null)
      setPreviewImage(null)

      try {
        const options: PreviewOptions = { quality }
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
  }, [originalImage, palette, quality])

  const retryGeneration = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const options: PreviewOptions = { quality }
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
      <div className={`space-y-4 ${className}`}>
        {/* Quality Selector - Always visible */}
        <QualitySelector
          quality={quality}
          setQuality={setQuality}
          qualityInfo={qualityInfo}
          disabled={isGenerating}
        />

        {/* Loading State */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-100">
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
              <p className="text-sm font-medium text-slate-700">
                Generating {qualityInfo[quality].label} preview...
              </p>
              <p className="mt-1 text-xs text-slate-500">This takes a few seconds</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !previewImage) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Quality Selector */}
        <QualitySelector
          quality={quality}
          setQuality={setQuality}
          qualityInfo={qualityInfo}
          disabled={isGenerating}
        />

        {/* Error State */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50">
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                {error || 'Preview not available'}
              </p>
              <button
                onClick={retryGeneration}
                className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quality Selector */}
      <QualitySelector
        quality={quality}
        setQuality={setQuality}
        qualityInfo={qualityInfo}
        disabled={isGenerating}
      />

      {/* Size Info */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">
              📐 Estimated Painting Size
            </p>
            <p className="text-xs text-slate-600">
              Based on {outputSize}px output at 150 DPI
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">
              {paintingSize.inches}"
            </p>
            <p className="text-xs text-slate-600">
              ({paintingSize.cm} cm)
            </p>
          </div>
        </div>
      </div>

      {/* Slider Component */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage
              src={originalImage}
              alt="Original Photo"
              style={{ objectFit: 'cover' }}
            />
          }
          itemTwo={
            <ReactCompareSliderImage
              src={previewImage}
              alt="Paint-by-Numbers Preview"
              style={{ objectFit: 'cover' }}
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
          <div className="rounded-lg bg-black/60 px-3 py-2 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-white">Original Photo</p>
          </div>
          <div className="rounded-lg bg-gradient-to-r from-primary-600/90 to-secondary-600/90 px-3 py-2 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-white">
              {qualityInfo[quality].emoji} {qualityInfo[quality].label}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
          <div className="mx-auto max-w-md rounded-lg bg-black/60 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-xs font-medium text-white">
              👆 <span className="font-bold">Drag the slider</span> to compare original vs paint-by-numbers version
            </p>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="rounded-xl bg-gradient-to-r from-primary-50 to-secondary-50 p-4 border border-primary-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800 mb-1">
              This is a simulated preview
            </p>
            <p className="text-xs text-slate-600">
              Your actual paint-by-numbers template will include numbered regions,
              a detailed color legend, and step-by-step painting guide. Choose higher
              quality for larger paintings or more detail.
            </p>
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
    <div className="rounded-xl bg-white border-2 border-slate-200 p-4">
      <div className="mb-3">
        <h4 className="text-sm font-bold text-slate-900 mb-1">
          🎨 Preview Quality & Size
        </h4>
        <p className="text-xs text-slate-600">
          {qualityInfo[quality].desc}
        </p>
      </div>

      {/* Quality Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {qualities.map((q) => (
          <button
            key={q}
            onClick={() => setQuality(q)}
            disabled={disabled}
            className={`
              relative px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
              ${quality === q
                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg scale-105'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="block text-base mb-0.5">{qualityInfo[q].emoji}</span>
            <span className="block text-xs">
              {q === 'low' && 'Fast'}
              {q === 'medium' && 'Balanced'}
              {q === 'high' && 'High'}
              {q === 'ultra' && 'Ultra'}
            </span>
            {quality === q && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </button>
        ))}
      </div>

      {/* Size indicators */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {qualities.map((q) => {
          const size = getQualityPreset(q).maxSize
          return (
            <div key={q} className="text-center text-slate-500">
              {size}px
            </div>
          )
        })}
      </div>
    </div>
  )
}
