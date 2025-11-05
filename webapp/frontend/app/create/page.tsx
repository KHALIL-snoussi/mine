'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { usePalettes, useModels } from '@/lib/hooks'
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

  const { data: palettesData } = usePalettes()
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary-600 cursor-pointer">
                🎨 Paint by Numbers AI
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/gallery">
                <Button variant="ghost">Gallery</Button>
              </Link>
              <Link href="/cart">
                <Button variant="outline">
                  🛒 Cart
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Paint by Numbers
          </h1>
          <p className="text-xl text-gray-600">
            Upload your photo, choose AI model, preview instantly, then order
          </p>
          <p className="text-sm text-primary-600 mt-2">
            ✨ Free preview • No account needed • Try different models free
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Upload Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Upload Your Photo</CardTitle>
                <CardDescription>
                  Best results with high-quality images (800x800+ pixels)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary-500 bg-primary-50'
                      : validation?.errors.length
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {preview ? (
                    <div className="space-y-4">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <div className="text-sm text-gray-600">
                        {selectedFile?.name}
                        {imageInfo && (
                          <div className="text-xs text-gray-500 mt-1">
                            {imageInfo.width}x{imageInfo.height} •{' '}
                            {(imageInfo.fileSize / (1024 * 1024)).toFixed(2)}MB
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        {isDragActive
                          ? 'Drop the image here'
                          : 'Drag and drop an image, or click to select'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG, WebP • 400x400 to 4000x4000 pixels • Max 10MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Validation Messages */}
                {showValidation && validation && (
                  <div className="mt-4 space-y-2">
                    {/* Errors */}
                    {validation.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="font-semibold text-red-900 text-sm mb-1">
                          ❌ Cannot Process:
                        </p>
                        {validation.errors.map((error, idx) => (
                          <p key={idx} className="text-sm text-red-700">
                            • {error}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Warnings */}
                    {validation.warnings.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="font-semibold text-yellow-900 text-sm mb-1">
                          ⚠️ Heads Up:
                        </p>
                        {validation.warnings.map((warning, idx) => (
                          <p key={idx} className="text-sm text-yellow-700">
                            • {warning}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Suggestions */}
                    {validation.suggestions.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        {validation.suggestions.map((suggestion, idx) => (
                          <p key={idx} className="text-sm text-blue-700">
                            {suggestion}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Image Quality Advice */}
                    {imageInfo && validation.valid && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="font-semibold text-green-900 text-sm mb-1">
                          💡 AI Recommendations:
                        </p>
                        {getImageQualityAdvice(imageInfo).map((advice, idx) => (
                          <p key={idx} className="text-sm text-green-700">
                            {advice}
                          </p>
                        ))}
                        {imageInfo && (
                          <p className="text-sm text-green-700 mt-2">
                            🤖 Recommended model: <strong>{recommendModel(imageInfo).modelId}</strong>
                            <br />
                            <span className="text-xs">{recommendModel(imageInfo).reason}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle>📸 Photo Tips for Best Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    <span><strong>High resolution:</strong> 800x800 pixels or larger</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    <span><strong>Good lighting:</strong> Clear, well-lit photos work best</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    <span><strong>Sharp focus:</strong> Avoid blurry or pixelated images</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    <span><strong>Clear subject:</strong> Main subject should be prominent</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2 mt-0.5">✗</span>
                    <span><strong>Avoid:</strong> Screenshots, heavily filtered, very dark photos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* What You Get */}
            <Card>
              <CardHeader>
                <CardTitle>What You'll Receive</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    AI-optimized numbered template
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    Complete color legend with paint codes
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    Step-by-step painting guide
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    Reference solution image
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    Difficulty rating & time estimate
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    Quality score & recommendations
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Model Selection - Only show if image is valid */}
        {validation?.valid && selectedFile && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Step 2: Choose Your AI Model
              </h2>
              <ModelSelector
                models={modelsData}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                isLoading={!modelsData}
              />
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <Card className="max-w-2xl w-full">
                <CardContent className="pt-6">
                  {!isGenerating ? (
                    <>
                      <Button
                        onClick={handleGenerate}
                        disabled={!selectedFile || !validation?.valid}
                        className="w-full"
                        size="lg"
                      >
                        ✨ Generate Preview (100% Free)
                      </Button>
                      <p className="text-center text-sm text-gray-500 mt-3">
                        Preview takes 30-60 seconds • No payment required • Try different models free
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{generationMessage}</span>
                        <span className="text-sm text-gray-500">{generationProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-primary-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-center text-gray-500">
                        ⏱️ This usually takes 30-60 seconds. Our AI is hard at work!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* How it Works */}
        {!selectedFile && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  1
                </div>
                <h3 className="font-semibold mb-1">Upload Photo</h3>
                <p className="text-sm text-gray-600">Choose your favorite image</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  2
                </div>
                <h3 className="font-semibold mb-1">Select AI Model</h3>
                <p className="text-sm text-gray-600">Choose complexity level</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  3
                </div>
                <h3 className="font-semibold mb-1">Preview Result</h3>
                <p className="text-sm text-gray-600">See it before you buy</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  4
                </div>
                <h3 className="font-semibold mb-1">Order & Paint</h3>
                <p className="text-sm text-gray-600">Get your kit delivered!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
