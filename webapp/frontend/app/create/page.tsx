'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { useModels } from '@/lib/hooks'
import ModelSelector from '@/components/ModelSelector'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { validateImage, getImageInfo, getImageQualityAdvice, recommendModel, type ValidationResult, type ImageInfo } from '@/lib/imageValidator'

export default function CreatePage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedPalette, setSelectedPalette] = useState('classic_18')
  const [selectedModel, setSelectedModel] = useState('classic')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')

  // Validation states
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  const { data: modelsData } = useModels()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      // Reset states
      setSelectedFile(null)
      setPreview(null)
      setValidation(null)
      setImageInfo(null)
      setShowValidation(false)

      // Validate image
      const validationResult = await validateImage(file)
      setValidation(validationResult)
      setShowValidation(true)

      if (validationResult.valid) {
        setSelectedFile(file)

        // Get image info
        try {
          const info = await getImageInfo(file)
          setImageInfo(info)

          // Auto-recommend model based on image
          const recommendation = recommendModel(info)
          setSelectedModel(recommendation.modelId)

          // Create preview
          const reader = new FileReader()
          reader.onloadend = () => {
            setPreview(reader.result as string)
          }
          reader.readAsDataURL(file)
        } catch (error) {
          console.error('Error loading image info:', error)
        }
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const handleGenerate = async () => {
    if (!selectedFile || !validation?.valid) return

    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationMessage('Uploading image...')

    try {
      // Simulate progress (real progress would come from websocket/polling)
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev
          return prev + 10
        })
      }, 3000)

      setGenerationMessage('AI is analyzing your image...')

      const template = await apiClient.generateTemplate(selectedFile, {
        palette_name: selectedPalette,
        model: selectedModel,
        title: 'Preview Template',
        is_public: !apiClient.isAuthenticated(),
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setGenerationMessage('Complete! Redirecting...')

      // Redirect to preview page
      setTimeout(() => {
        router.push(`/preview/${template.id}`)
      }, 500)
    } catch (error: any) {
      console.error('Generation failed:', error)
      setGenerationMessage('')
      setGenerationProgress(0)

      // Show user-friendly error
      const errorMsg = error.message || 'Generation failed'
      alert(
        `😔 Oops! Something went wrong.\n\n` +
        `${errorMsg}\n\n` +
        `💡 Try:\n` +
        `• Using a different image\n` +
        `• Reducing image size if very large\n` +
        `• Checking your internet connection\n\n` +
        `Still having issues? Contact support.`
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.2),_transparent_60%)]" />
      <div className="pointer-events-none absolute -top-40 right-[-8%] h-96 w-96 rounded-full bg-primary-500/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[32rem] w-[32rem] rounded-full bg-secondary-500/20 blur-3xl" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <h1 className="text-2xl font-semibold text-white transition-colors hover:text-secondary-200">
              🎨 Paint by Numbers AI
            </h1>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/gallery">
              <Button variant="ghost" className="text-slate-200 hover:text-white">
                Gallery
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline" className="border-white/20 text-white hover:border-white/40 hover:bg-white/10">
                🛒 Cart
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pb-24">
        {/* Hero */}
        <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 pt-16 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-secondary-100">
            No account required · Instant preview
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Design your custom paint-by-numbers kit in minutes
          </h1>
          <p className="max-w-3xl text-lg text-slate-200">
            Upload a photo, let our AI balance colors and detail, and preview a print-ready template before you ever checkout. Switch models freely until it feels perfect.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-200">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
              ⚡ Preview in ~45 seconds
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
              🎯 AI palette & difficulty guidance
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
              🖨️ Ready-to-print downloads
            </span>
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            {/* Upload Section */}
            <Card className="border-white/40 bg-white/95 text-slate-900 shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Step 1 · Upload your photo</CardTitle>
                <CardDescription className="text-slate-500">
                  Crisp, well-lit images between 800×800 and 4000×4000 pixels work best.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-slate-50 p-12 text-center transition-all ${
                    isDragActive
                      ? 'border-secondary-400 bg-secondary-50/70'
                      : validation?.errors.length
                        ? 'border-red-300 bg-red-50/80'
                        : 'border-slate-200 hover:border-secondary-300 hover:bg-slate-100'
                  }`}
                >
                  <input {...getInputProps()} />
                  {preview ? (
                    <div className="space-y-4">
                      <img
                        src={preview}
                        alt="Preview"
                        className="mx-auto max-h-64 rounded-xl border border-white/60 shadow-lg"
                      />
                      <div className="text-sm text-slate-600">
                        {selectedFile?.name}
                        {imageInfo && (
                          <div className="mt-1 text-xs text-slate-500">
                            {imageInfo.width}x{imageInfo.height} • {(imageInfo.fileSize / (1024 * 1024)).toFixed(2)}MB
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        Change image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
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
                        {isDragActive ? 'Drop the image to start' : 'Drag and drop an image, or click to browse'}
                      </p>
                      <p className="text-xs text-slate-500">
                        JPG, PNG, or WebP · up to 10MB · we never store without your consent
                      </p>
                    </div>
                  )}
                </div>

                {/* Validation Messages */}
                {showValidation && validation && (
                  <div className="mt-5 space-y-3">
                    {validation.errors.length > 0 && (
                      <div className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-left text-sm text-red-700 shadow-sm">
                        <p className="font-semibold">We need a different image:</p>
                        {validation.errors.map((error, idx) => (
                          <p key={idx} className="mt-1">
                            • {error}
                          </p>
                        ))}
                      </div>
                    )}

                    {validation.warnings.length > 0 && (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50/90 p-3 text-left text-sm text-yellow-700 shadow-sm">
                        <p className="font-semibold">Heads up:</p>
                        {validation.warnings.map((warning, idx) => (
                          <p key={idx} className="mt-1">
                            • {warning}
                          </p>
                        ))}
                      </div>
                    )}

                    {validation.suggestions.length > 0 && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50/90 p-3 text-left text-sm text-blue-700 shadow-sm">
                        {validation.suggestions.map((suggestion, idx) => (
                          <p key={idx}>{suggestion}</p>
                        ))}
                      </div>
                    )}

                    {imageInfo && validation.valid && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 text-left text-sm text-emerald-700 shadow-sm">
                        <p className="font-semibold">AI guidance</p>
                        {getImageQualityAdvice(imageInfo).map((advice, idx) => (
                          <p key={idx} className="mt-1">
                            {advice}
                          </p>
                        ))}
                        <p className="mt-2 text-xs text-emerald-600">
                          🤖 Suggested model: <strong>{recommendModel(imageInfo).modelId}</strong>
                          <br />
                          <span>{recommendModel(imageInfo).reason}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guidance Section */}
            <div className="space-y-6">
              <Card className="border-white/10 bg-slate-900/60 text-slate-100 shadow-xl backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl text-white">Creative success checklist</CardTitle>
                  <CardDescription className="text-slate-300">
                    Follow these quick wins to get a crisp, satisfying paintable template.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-200">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-emerald-400">✓</span>
                    <span><strong>High resolution:</strong> Aim for 800px or larger on the shortest side.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-emerald-400">✓</span>
                    <span><strong>Even lighting:</strong> Natural daylight removes harsh shadows.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-emerald-400">✓</span>
                    <span><strong>Single subject focus:</strong> Keep your star centered and in focus.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-rose-400">✗</span>
                    <span>Avoid screenshots, heavy filters, or dark/blurry images.</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/40 bg-white/95 text-slate-900 shadow-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">What you'll receive</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-primary-600">✓</span>
                    <span>AI-optimized numbered template and matching color legend.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-primary-600">✓</span>
                    <span>Difficulty rating, time estimate, and quality insights.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-primary-600">✓</span>
                    <span>Step-by-step painting guide, reference solution, and optional SVG/PDF downloads.</span>
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-left shadow-xl backdrop-blur">
                <h3 className="text-lg font-semibold text-white">Preview is always free</h3>
                <p className="mt-2 text-sm text-slate-300">
                  Generate unlimited previews without logging in. When you love the result you can order a kit—or download the digital files instantly.
                </p>
                <p className="mt-4 text-xs uppercase tracking-widest text-secondary-200">~30-60 seconds to generate</p>
              </div>
            </div>
          </div>
        </section>

        {/* Model Selection - Only show if image is valid */}
        {validation?.valid && selectedFile && (
          <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-xl backdrop-blur">
              <div className="flex flex-col gap-4 pb-6 text-left lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-3xl font-semibold text-white">Step 2 · Choose your AI style</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Toggle between detailed, vibrant, or minimalist looks—every preview is on us.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-1 text-xs text-slate-300 sm:flex-row sm:items-center sm:gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1">
                    🎨 Palette locked to paintable colors
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1">
                    🔁 Switch models anytime
                  </span>
                </div>
              </div>
              <ModelSelector
                models={modelsData}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                isLoading={!modelsData}
              />
            </div>

            {/* Generate Button */}
            <div className="mt-10 flex justify-center">
              <Card className="w-full max-w-2xl border-white/40 bg-white/95 text-slate-900 shadow-2xl">
                <CardContent className="pt-6">
                  {!isGenerating ? (
                    <>
                      <Button
                        onClick={handleGenerate}
                        disabled={!selectedFile || !validation?.valid}
                        className="w-full"
                        size="lg"
                      >
                        ✨ Generate preview (always free)
                      </Button>
                      <p className="mt-3 text-center text-sm text-slate-500">
                        Your files stay private. Guests get public preview links so you can share instantly.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>{generationMessage}</span>
                        <span>{generationProgress}%</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-3 rounded-full bg-secondary-500 transition-all duration-500 ease-out"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                      <p className="text-center text-xs text-slate-500">
                        We render smart contours, balance colors, and package downloads—hang tight!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* How it works */}
        {!selectedFile && (
          <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center shadow-xl backdrop-blur">
              <h2 className="text-3xl font-semibold text-white">How your preview comes together</h2>
              <p className="mt-3 text-slate-300">
                A guided pipeline that keeps things simple while our AI handles the complex bits.
              </p>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { step: '1', title: 'Upload & validate', description: 'We inspect dimensions, lighting, and focus before processing.' },
                  { step: '2', title: 'Palette intelligence', description: 'Smart clustering keeps colors mixable and painter-friendly.' },
                  { step: '3', title: 'Detail balancing', description: 'Regions are merged or simplified to match your chosen difficulty.' },
                  { step: '4', title: 'Preview & deliver', description: 'Download the template, legend, guide, and comparison images.' },
                ].map(({ step, title, description }) => (
                  <div key={step} className="rounded-xl border border-white/10 bg-white/5 p-6 text-left shadow-lg">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-500/20 text-lg font-semibold text-secondary-100">
                      {step}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )

}
