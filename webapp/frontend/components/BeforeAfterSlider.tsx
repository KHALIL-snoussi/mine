'use client'

import { useState, useEffect } from 'react'
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider'
import { generatePaintPreview } from '@/lib/previewGenerator'

interface BeforeAfterSliderProps {
  originalImage: string
  palette: {
    name: string
    colors: number[][]
  }
  className?: string
}

export default function BeforeAfterSlider({
  originalImage,
  palette,
  className = '',
}: BeforeAfterSliderProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Generate preview when image or palette changes
    const generatePreview = async () => {
      setIsGenerating(true)
      setError(null)
      setPreviewImage(null)

      try {
        const preview = await generatePaintPreview(originalImage, palette)
        setPreviewImage(preview)
      } catch (err) {
        console.error('Error generating preview:', err)
        setError('Failed to generate preview. Try a smaller image.')
      } finally {
        setIsGenerating(false)
      }
    }

    generatePreview()
  }, [originalImage, palette])

  const retryGeneration = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const preview = await generatePaintPreview(originalImage, palette)
      setPreviewImage(preview)
    } catch (err) {
      console.error('Error generating preview:', err)
      setError('Failed to generate preview. Try a smaller image.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (isGenerating) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-slate-100 ${className}`}>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
            <p className="text-sm font-medium text-slate-700">
              Generating paint-by-numbers preview...
            </p>
            <p className="mt-1 text-xs text-slate-500">This takes a few seconds</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !previewImage) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 ${className}`}>
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
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-2xl ${className}`}>
      {/* Slider Component */}
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
          <p className="text-xs font-bold uppercase tracking-wider text-white">Paint Preview</p>
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
  )
}
