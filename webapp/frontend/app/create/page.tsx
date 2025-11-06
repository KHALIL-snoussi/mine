'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'

import { Button } from '@/components/ui/Button'
import ModelSelector from '@/components/ModelSelector'
import BeforeAfterSlider from '@/components/BeforeAfterSlider'
import ManualAreaSelector, { type SelectedArea } from '@/components/ManualAreaSelector'
import PortraitCropSelector from '@/components/PortraitCropSelector'
import { apiClient, type KitRecommendation } from '@/lib/api'
import { useModels, usePalettes } from '@/lib/hooks'
import {
  validateImage,
  getImageInfo,
  getImageQualityAdvice,
  recommendModel,
  type ImageInfo,
  type ValidationResult,
} from '@/lib/imageValidator'

function rgbToHex([r, g, b]: number[]) {
  const toHex = (value: number) => value.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function CreatePage() {
  const router = useRouter()

const [selectedFile, setSelectedFile] = useState<File | null>(null)
const [preview, setPreview] = useState<string | null>(null)
const [originalPreview, setOriginalPreview] = useState<string | null>(null)
const [showCropSelector, setShowCropSelector] = useState(false)
const [croppedFile, setCroppedFile] = useState<File | null>(null)
const [selectedModel, setSelectedModel] = useState('original')
const [recommendedModel, setRecommendedModel] = useState<{ modelId: string; reason: string } | null>(null)
const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null)

  // Model-to-palette mapping (each model has its own colors)
  const MODEL_PALETTES: Record<string, string> = {
    'original': 'realistic_natural',
    'vintage': 'vintage_warm',
    'pop_art': 'pop_art_bold',
    'full_color_hd': 'full_color_hd_38',
  }

  // Get the palette for the selected model
  const selectedPalette = MODEL_PALETTES[selectedModel] || 'realistic_natural'

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')

  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  const [kitRecommendation, setKitRecommendation] = useState<KitRecommendation | null>(null)
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false)
  const [showAllKits, setShowAllKits] = useState(false)

  const { data: modelsData } = useModels()
  const { data: palettesData } = usePalettes()

  const selectedPaletteInfo = useMemo(
    () => palettesData?.find((palette) => palette.name === selectedPalette),
    [palettesData, selectedPalette]
  )

  const hasValidImage = Boolean(selectedFile && validation?.valid && (croppedFile || !showCropSelector))

  const steps = useMemo(() => {
    return [
      {
        id: 1,
        label: 'Upload',
        state: selectedFile ? 'done' : showValidation ? 'active' : 'idle',
      },
      {
        id: 2,
        label: 'Crop',
        state: croppedFile ? 'done' : showCropSelector ? 'active' : selectedFile ? 'ready' : 'idle',
      },
      {
        id: 3,
        label: 'Style',
        state: isGenerating
          ? 'active'
          : hasValidImage
            ? 'ready'
            : 'idle',
      },
      {
        id: 4,
        label: 'Generate',
        state: isGenerating ? 'active' : hasValidImage ? 'ready' : 'idle',
      },
    ]
  }, [selectedFile, showValidation, showCropSelector, croppedFile, hasValidImage, isGenerating])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setSelectedFile(null)
    setPreview(null)
    setOriginalPreview(null)
    setShowCropSelector(false)
    setCroppedFile(null)
    setValidation(null)
    setImageInfo(null)
    setRecommendedModel(null)
    setShowValidation(false)
    setKitRecommendation(null)
    setShowAllKits(false)

    const validationResult = await validateImage(file)
    setValidation(validationResult)
    setShowValidation(true)

    if (!validationResult.valid) {
      return
    }

    setSelectedFile(file)

    try {
      const info = await getImageInfo(file)
      setImageInfo(info)

      const recommendation = recommendModel(info)
      setSelectedModel(recommendation.modelId)
      setRecommendedModel(recommendation)

      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        setOriginalPreview(dataUrl)
        setShowCropSelector(true) // Show crop selector instead of preview immediately
      }
      reader.readAsDataURL(file)

      // Get kit recommendation from AI
      setIsLoadingRecommendation(true)
      try {
        const kitRec = await apiClient.getKitRecommendation(file)
        setKitRecommendation(kitRec)
        // Note: Palette is now automatically selected based on the model, not the kit
      } catch (error) {
        console.error('Error getting kit recommendation:', error)
      } finally {
        setIsLoadingRecommendation(false)
      }
    } catch (error) {
      console.error('Error loading image info:', error)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    multiple: false,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  // Handle crop completion
  const handleCropComplete = async (croppedImageUrl: string) => {
    // Convert cropped image URL to File
    const response = await fetch(croppedImageUrl)
    const blob = await response.blob()
    const file = new File([blob], selectedFile?.name || 'cropped.jpg', { type: 'image/jpeg' })

    setCroppedFile(file)
    setPreview(croppedImageUrl)
    setShowCropSelector(false)

    // Update image info for cropped image
    try {
      const info = await getImageInfo(file)
      setImageInfo(info)
    } catch (error) {
      console.error('Error loading cropped image info:', error)
    }
  }

  // Handle crop cancel
  const handleCropCancel = () => {
    // Reset to initial state
    setShowCropSelector(false)
    setSelectedFile(null)
    setOriginalPreview(null)
    setPreview(null)
  }

  const handleGenerate = async () => {
    if (!selectedFile || !validation?.valid) return

    // Use cropped file if available, otherwise use original
    const fileToUpload = croppedFile || selectedFile

    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationMessage('Uploading image...')

    let progressInterval: ReturnType<typeof setInterval> | null = null

    try {
      progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 92) return prev
          return prev + 8
        })
      }, 2000)

      setGenerationMessage('Analyzing colors and balancing detail...')

      const template = await apiClient.generateTemplate(fileToUpload, {
        palette_name: selectedPalette,
        model: selectedModel,
        title: selectedFile.name || 'Preview Template',
        is_public: !apiClient.isAuthenticated(),
        // No region emphasis needed - we're using the entire cropped area
        use_region_emphasis: false,
      })

      setGenerationProgress(100)
      setGenerationMessage('Complete! Opening your preview...')

      setTimeout(() => {
        router.push(`/preview/${template.id}`)
      }, 600)
    } catch (error: any) {
      console.error('Generation failed:', error)
      const message = error?.message ?? 'Generation failed'
      setGenerationMessage('')
      setGenerationProgress(0)

      alert(
        `😔 Oops! Something went wrong.\n\n` +
          `${message}\n\n` +
          `💡 Try:\n` +
          `• Choosing a different image\n` +
          `• Reducing image size if it's very large\n` +
          `• Checking your internet connection\n\n` +
          `Still having issues? Contact support.`
      )
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100">
      <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold text-slate-900 transition-colors hover:text-primary-600">
            🎨 Paint by Numbers AI
          </Link>
          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <Link href="/shop" className="rounded-full px-3 py-1.5 transition-colors hover:bg-slate-100 hover:text-slate-900">
              Shop Kits
            </Link>
            <Link href="/gallery" className="rounded-full px-3 py-1.5 transition-colors hover:bg-slate-100 hover:text-slate-900">
              Gallery
            </Link>
            <Link href="/cart" className="rounded-full px-3 py-1.5 transition-colors hover:bg-slate-100 hover:text-slate-900">
              Cart
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
          <section className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600">
              No login needed · Unlimited previews
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Turn any photo into a paint-by-numbers masterpiece
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              Upload, tune, and preview in minutes. Shareable previews are ready for guests, and you can order a full kit whenever you love the result.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">⚡ Preview in ~45 seconds</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">🎯 Smart palette guidance</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">🖨️ Print-ready downloads</span>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="space-y-8">
              <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/70">
                <div className="flex flex-col gap-6 border-b border-slate-200/70 p-8 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      {!selectedFile ? 'Step 1 · Upload your photo' : showCropSelector ? 'Step 2 · Position portrait frame' : 'Step 1 · Upload complete ✓'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {!selectedFile ? 'Upload any photo - you\'ll crop it to portrait dimensions (600×800px) next.' : showCropSelector ? 'Drag the frame to select which area to process. All work happens inside this crop.' : 'Image cropped and ready for processing!'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {steps.map((step, idx) => {
                      const stateClass =
                        step.state === 'done'
                          ? 'bg-primary-600 text-white border-primary-600'
                          : step.state === 'active'
                            ? 'border-primary-500 text-primary-600'
                            : step.state === 'ready'
                              ? 'border-primary-300 text-primary-500'
                              : 'border-slate-200 text-slate-400'

                      return (
                        <div key={step.id} className="flex items-center gap-2">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${stateClass}`}>
                            {step.id}
                          </span>
                          <span className="hidden text-xs font-medium sm:block">{step.label}</span>
                          {idx < steps.length - 1 && <span className="hidden h-px w-8 bg-slate-200 sm:block" />}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="p-8">
                  <div
                    {...getRootProps()}
                    className={`group relative flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-slate-50 p-8 text-center transition-all ${
                      isDragActive
                        ? 'border-primary-400 bg-primary-50/70'
                        : validation?.errors?.length
                          ? 'border-red-300 bg-red-50/80'
                          : 'border-slate-200 hover:border-primary-200 hover:bg-white'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {(preview || showCropSelector) ? (
                      <div className="flex w-full flex-col items-center gap-4">
                        {preview && (
                          <>
                            <img
                              src={preview}
                              alt="Cropped preview"
                              className="max-h-64 rounded-2xl border-2 border-primary-200 object-contain shadow-md"
                            />
                            <div className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700">
                              ✓ Cropped to 600 × 800px portrait
                            </div>
                          </>
                        )}
                        <div className="text-sm text-slate-600">
                          <p className="font-medium">{selectedFile?.name}</p>
                          {imageInfo && preview && (
                            <p className="text-xs text-slate-500">
                              {imageInfo.width} × {imageInfo.height} · {formatFileSize(imageInfo.fileSize)}
                            </p>
                          )}
                        </div>
                        {preview && (
                          <Button variant="outline" size="sm" type="button" onClick={() => open()}>
                            Change image
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-500">
                          <svg className="h-8 w-8" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-700">
                          {isDragActive ? 'Drop the image to start' : 'Drag & drop an image, or click to browse'}
                        </p>
                        <p className="text-xs text-slate-500">JPG, PNG, or WebP · up to 10MB · we never store without your consent</p>
                      </div>
                    )}
                  </div>

                  {showValidation && validation && (
                    <div className="mt-6 space-y-4">
                      {validation.errors.length > 0 && (
                        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-left text-sm text-red-700 shadow-sm">
                          <p className="font-semibold">We need a different image:</p>
                          <ul className="mt-1 space-y-1">
                            {validation.errors.map((error, idx) => (
                              <li key={idx}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validation.warnings.length > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-left text-sm text-amber-700 shadow-sm">
                          <p className="font-semibold">Heads up:</p>
                          <ul className="mt-1 space-y-1">
                            {validation.warnings.map((warning, idx) => (
                              <li key={idx}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validation.suggestions.length > 0 && (
                        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-left text-sm text-sky-700 shadow-sm">
                          <ul className="space-y-1">
                            {validation.suggestions.map((suggestion, idx) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {imageInfo && validation.valid && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-left text-sm text-emerald-700 shadow-sm">
                            <p className="font-semibold">AI guidance</p>
                            <ul className="mt-2 space-y-1">
                              {getImageQualityAdvice(imageInfo).map((advice, idx) => (
                                <li key={idx}>{advice}</li>
                              ))}
                            </ul>
                          </div>
                          {recommendedModel && (
                            <div className="rounded-2xl border border-primary-200 bg-primary-50/80 p-4 text-left text-sm text-primary-700 shadow-sm">
                              <p className="font-semibold">Recommended style</p>
                              <p className="mt-2 text-base font-semibold text-primary-700">
                                {recommendedModel.modelId.charAt(0).toUpperCase() + recommendedModel.modelId.slice(1)} model
                              </p>
                              <p className="mt-1 text-xs text-primary-600">{recommendedModel.reason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {imageInfo && (
                    <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-left text-xs text-slate-600 sm:grid-cols-2">
                      <div>
                        <p className="text-[0.75rem] font-semibold uppercase tracking-widest text-slate-500">Image details</p>
                        <ul className="mt-2 space-y-1">
                          <li>Resolution: {imageInfo.width} × {imageInfo.height}</li>
                          <li>Aspect ratio: {imageInfo.aspectRatio.toFixed(2)}:1</li>
                          <li>File size: {formatFileSize(imageInfo.fileSize)}</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-[0.75rem] font-semibold uppercase tracking-widest text-slate-500">Quick tips</p>
                        <ul className="mt-2 space-y-1">
                          <li>Best on matte or canvas stock</li>
                          <li>Keep the subject well lit</li>
                          <li>Use painter's tape for crisp edges</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* AI Kit Recommendation */}
                  {isLoadingRecommendation && (
                    <div className="mt-6 rounded-2xl border border-primary-200 bg-primary-50/50 p-6">
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
                        <p className="text-sm font-medium text-primary-800">AI is analyzing your image to recommend the perfect paint kit...</p>
                      </div>
                    </div>
                  )}

                  {kitRecommendation && !isLoadingRecommendation && (
                    <div className="mt-6 rounded-2xl border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-secondary-50 p-6 shadow-lg">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="text-3xl">🎯</span>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 mb-1">AI Recommendation for Your Image</h3>
                          <p className="text-sm text-slate-600">
                            We analyzed your {kitRecommendation.analysis.subject_type} photo
                          </p>
                        </div>
                        <div className="rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white">
                          {Math.round(kitRecommendation.confidence)}% Match
                        </div>
                      </div>

                      {/* Analysis Summary */}
                      <div className="mb-4 flex flex-wrap gap-2">
                        {kitRecommendation.analysis.is_portrait && (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            ✓ Portrait detected
                          </span>
                        )}
                        {kitRecommendation.analysis.is_pet && (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            ✓ Pet photo
                          </span>
                        )}
                        {kitRecommendation.analysis.is_landscape && (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            ✓ Landscape scene
                          </span>
                        )}
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                          {kitRecommendation.analysis.complexity_level} complexity
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                          {kitRecommendation.analysis.colors_detected} colors detected
                        </span>
                      </div>

                      {/* Recommended Kit */}
                      <div className="rounded-xl bg-white p-5 shadow-md border-2 border-primary-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-1">Best Match</p>
                            <h4 className="text-xl font-bold text-slate-900">{kitRecommendation.recommended_kit.display_name}</h4>
                            <p className="text-2xl font-bold text-primary-600 mt-1">${kitRecommendation.recommended_kit.price_usd}</p>
                          </div>
                          <div className="text-right">
                            <div className="inline-block rounded-lg bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">
                              {kitRecommendation.recommended_kit.num_colors} Colors
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{kitRecommendation.recommended_kit.sku}</p>
                          </div>
                        </div>

                        {/* Reasons */}
                        <div className="space-y-2 mb-4">
                          {kitRecommendation.reasoning.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-primary-600 mt-0.5">✓</span>
                              <span className="text-sm text-slate-700">{reason}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600">
                            Use This Kit
                          </Button>
                          <Link href="/shop">
                            <Button variant="outline" size="sm">
                              Shop Now
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Show All Kits Button */}
                      <button
                        onClick={() => setShowAllKits(!showAllKits)}
                        className="mt-4 w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-primary-300 hover:bg-primary-50"
                      >
                        {showAllKits ? '↑ Hide' : '↓ Compare All 6 Paint Kits Side-by-Side'}
                      </button>

                      {/* All Kits Comparison */}
                      {showAllKits && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {kitRecommendation.all_kits_ranked.map((kitData, idx) => (
                            <div
                              key={kitData.kit.id}
                              className={`rounded-xl border-2 p-4 transition-all ${
                                kitData.kit.id === kitRecommendation.recommended_kit.id
                                  ? 'border-primary-500 bg-primary-50/50 shadow-md'
                                  : 'border-slate-200 bg-white hover:border-primary-200 hover:shadow'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="text-xs font-semibold text-slate-500">#{idx + 1}</p>
                                  <h5 className="text-sm font-bold text-slate-900">{kitData.kit.name}</h5>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-primary-600">${kitData.kit.price_usd}</p>
                                  <p className="text-xs text-slate-500">{kitData.kit.num_colors} colors</p>
                                </div>
                              </div>

                              <div className="mb-3 rounded bg-slate-100 p-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 flex-1 rounded-full bg-slate-200">
                                    <div
                                      className="h-2 rounded-full bg-primary-500"
                                      style={{ width: `${kitData.score}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-slate-600">{Math.round(kitData.score)}%</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                {kitData.reasons.slice(0, 2).map((reason, ridx) => (
                                  <p key={ridx} className="text-xs text-slate-600">• {reason}</p>
                                ))}
                              </div>

                              <Link href="/shop">
                                <button
                                  className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all bg-slate-100 text-slate-700 hover:bg-slate-200"
                                >
                                  View This Kit
                                </button>
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Portrait Crop Selector - First step after upload */}
                  {showCropSelector && originalPreview && (
                    <div className="mt-8">
                      <PortraitCropSelector
                        imageUrl={originalPreview}
                        onCropComplete={handleCropComplete}
                        onCancel={handleCropCancel}
                      />
                    </div>
                  )}

                  {/* Before/After Comparison Slider */}
                  {preview && selectedPaletteInfo && !isLoadingRecommendation && (
                    <div className="mt-8">
                      <BeforeAfterSlider
                        originalImage={preview}
                        palette={{
                          name: selectedPalette,
                          colors: selectedPaletteInfo.colors
                        }}
                        model={selectedModel}
                      />
                    </div>
                  )}
                </div>
              </div>

              {hasValidImage && (
                <div className="space-y-8">
                  <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/70">
                    <div className="border-b border-slate-200/70 p-8">
                      <h2 className="text-2xl font-semibold text-slate-900">Step 3 · Choose your style</h2>
                      <p className="mt-1 text-sm text-slate-500">Select an AI model - each has its own unique colors and style. All processing happens inside your cropped area.</p>
                    </div>
                    <div className="p-8">
                      <ModelSelector
                        models={modelsData}
                        selectedModel={selectedModel}
                        onSelectModel={setSelectedModel}
                        isLoading={!modelsData}
                      />

                      {/* Info about automatic palette selection */}
                      <div className="mt-6 rounded-xl bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-primary-200 p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">✨</span>
                          <div>
                            <p className="text-sm font-bold text-slate-900 mb-1">
                              Each Model Uses Its Own Colors
                            </p>
                            <p className="text-xs text-slate-700">
                              Your selected model automatically comes with its optimized color palette. No need to choose separately!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/70">
                    <div className="border-b border-slate-200/70 p-8">
                      <h2 className="text-2xl font-semibold text-slate-900">Step 4 · Generate your preview</h2>
                      <p className="mt-1 text-sm text-slate-500">We'll process your cropped portrait and build the template, legend, and guides automatically.</p>
                    </div>
                    <div className="p-8">
                      {!isGenerating ? (
                        <div className="space-y-4">
                          <Button
                            onClick={handleGenerate}
                            disabled={!selectedFile || !validation?.valid}
                            className="h-12 w-full text-base"
                          >
                            ✨ Generate free preview
                          </Button>
                          <p className="text-sm text-slate-500">
                            Guests receive a public preview link for easy sharing. We only store files while your preview stays active.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>{generationMessage}</span>
                            <span>{generationProgress}%</span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-3 rounded-full bg-primary-500 transition-all duration-500 ease-out"
                              style={{ width: `${generationProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500">
                            We trace contours, balance palette colors, and package download files. This usually takes less than a minute.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-200/70">
                <h3 className="text-lg font-semibold text-slate-900">What you’ll receive</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary-500">✓</span>
                    <span>Numbered template in high resolution plus printable legend.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary-500">✓</span>
                    <span>Difficulty score, estimated painting time, and quality guidance.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary-500">✓</span>
                    <span>Reference solution, painting tips, and optional SVG/PDF exports.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-primary-500/10 p-8 shadow-lg ring-1 ring-primary-200/40">
                <h3 className="text-lg font-semibold text-slate-900">Pro tips for a stunning kit</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary-500">•</span>
                    <span>Zoom in on your subject — a single focal point paints beautifully.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary-500">•</span>
                    <span>Try different AI models to balance detail and simplicity.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary-500">•</span>
                    <span>Pick palettes that match your décor or the subject’s mood.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl bg-white/90 p-8 shadow-lg ring-1 ring-slate-200/70">
                <h3 className="text-lg font-semibold text-slate-900">How it works</h3>
                <div className="mt-6 space-y-4 text-sm text-slate-600">
                  {[
                    {
                      title: 'Smart validation',
                      description: 'We check size, clarity, and aspect ratio before processing.',
                    },
                    {
                      title: 'AI-powered segmentation',
                      description: 'Colors are clustered into painter-friendly palettes while keeping detail.',
                    },
                    {
                      title: 'Ready to paint outputs',
                      description: 'Template, legend, and guides are packaged for download automatically.',
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          {!selectedFile && (
            <section className="mt-4 rounded-3xl bg-white/80 p-10 text-center shadow-xl ring-1 ring-slate-200/70">
              <h2 className="text-3xl font-semibold text-slate-900">Why creators love the workflow</h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
                Our generator handles the heavy lifting while you stay in control. Upload a photo, validate quality instantly, explore AI styles, and download professional outputs without logging in.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: '🧼', title: 'Clean contours', description: 'Automatic smoothing keeps paint regions neat and traceable.' },
                  { icon: '🧠', title: 'Palette intelligence', description: 'Palettes are optimized for real paint sets—no muddy colors.' },
                  { icon: '🪄', title: 'Detail control', description: 'Swap between simple, classic, or detailed looks anytime.' },
                  { icon: '📦', title: 'Instant kit-ready files', description: 'Print templates, legends, and guides with one click.' },
                ].map((feature) => (
                  <div key={feature.title} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-6 text-left">
                    <div className="text-2xl">{feature.icon}</div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">{feature.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
