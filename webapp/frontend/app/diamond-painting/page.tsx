'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'

import { Button } from '@/components/ui/Button'
import DiamondCropSelector from '@/components/DiamondCropSelector'
import { generateDiamondPainting, DiamondPaintingResult, DiamondPaintingOptions } from '@/lib/diamondPaintingGenerator'
import { downloadMaterialsList, printMaterialsList } from '@/lib/diamondPaintingPDF'
import { getDMCCategories } from '@/lib/dmcColors'

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function DiamondPaintingPage() {
  const router = useRouter()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [showCropSelector, setShowCropSelector] = useState(false)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [result, setResult] = useState<DiamondPaintingResult | null>(null)

  // Diamond painting options
  const [canvasSize, setCanvasSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium')
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('high')
  const [drillShape, setDrillShape] = useState<'square' | 'round'>('square')
  const [maxColors, setMaxColors] = useState(40)

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    console.log('Drop triggered - Accepted:', acceptedFiles, 'Rejected:', rejectedFiles)

    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles[0].errors.map((e: any) => e.message).join(', ')
      alert(`File rejected: ${errors}`)
      return
    }

    const file = acceptedFiles[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File selected:', file.name, file.type, file.size)
    setSelectedFile(file)
    setResult(null)
    setPreview(null)
    setCroppedImage(null)

    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        console.log('File loaded successfully')
        const dataUrl = reader.result as string
        setOriginalPreview(dataUrl)
        setShowCropSelector(true) // Show crop selector instead of going straight to preview
      }
      reader.onerror = (error) => {
        console.error('File reading error:', error)
        alert('Error reading file. Please try again.')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Error processing file. Please try again.')
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
  const handleCropComplete = (croppedImageUrl: string) => {
    setCroppedImage(croppedImageUrl)
    setPreview(croppedImageUrl)
    setShowCropSelector(false)
  }

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropSelector(false)
    setSelectedFile(null)
    setOriginalPreview(null)
  }

  const handleGenerate = async () => {
    const imageToProcess = croppedImage || preview
    if (!imageToProcess) return

    setIsGenerating(true)
    setGenerationProgress(0)

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) return prev
        return prev + 10
      })
    }, 300)

    try {
      const options: DiamondPaintingOptions = {
        canvasSize,
        quality,
        drillShape,
        maxColors,
      }

      const diamondResult = await generateDiamondPainting(imageToProcess, options)

      setGenerationProgress(100)
      setResult(diamondResult)
    } catch (error: any) {
      console.error('Generation failed:', error)
      alert(`Generation failed: ${error?.message || 'Unknown error'}`)
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
    }
  }

  const handleDownloadMaterials = () => {
    if (!result) return
    downloadMaterialsList(result, {
      title: selectedFile?.name || 'Custom Diamond Painting',
      customerName: 'Your Name',
    })
  }

  const handlePrintMaterials = () => {
    if (!result) return
    printMaterialsList(result, {
      title: selectedFile?.name || 'Custom Diamond Painting',
      customerName: 'Your Name',
    })
  }

  const handleDownloadPattern = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.imageDataUrl
    a.download = `diamond-painting-pattern-${selectedFile?.name || 'custom'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100">
      <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold text-slate-900 transition-colors hover:text-primary-600">
            💎 Diamond Painting AI
          </Link>
          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <Link href="/create" className="rounded-full px-3 py-1.5 transition-colors hover:bg-slate-100 hover:text-slate-900">
              Paint by Numbers
            </Link>
            <Link href="/shop" className="rounded-full px-3 py-1.5 transition-colors hover:bg-slate-100 hover:text-slate-900">
              Shop Kits
            </Link>
            <Link href="/gallery" className="rounded-full px-3 py-1.5 transition-colors hover:bg-slate-100 hover:text-slate-900">
              Gallery
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
          <section className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600">
              💎 Diamond Painting Generator
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Turn any photo into a sparkling diamond painting
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              Upload your image and we'll create a complete diamond painting pattern with DMC color codes, materials list, and instructions.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">✨ Pixelated mosaic style</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">🎨 Standard DMC colors</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">📋 Complete materials list</span>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* Left Column - Upload & Options */}
            <div className="space-y-8">
              {/* Upload Section */}
              <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/70">
                <div className="border-b border-slate-200/70 p-8">
                  <h2 className="text-2xl font-semibold text-slate-900">Step 1 · Upload your photo</h2>
                  <p className="mt-1 text-sm text-slate-500">Choose any image to transform into a diamond painting pattern</p>
                </div>

                <div className="p-8">
                  {showCropSelector && originalPreview ? (
                    <DiamondCropSelector
                      imageUrl={originalPreview}
                      aspectRatio="free"
                      onCropComplete={handleCropComplete}
                      onCancel={handleCropCancel}
                    />
                  ) : (
                    <div
                      {...getRootProps()}
                      className={`group relative flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-slate-50 p-8 text-center transition-all ${
                        isDragActive
                          ? 'border-primary-400 bg-primary-50/70'
                          : 'border-slate-200 hover:border-primary-200 hover:bg-white'
                      }`}
                    >
                      <input {...getInputProps()} />
                      {preview && !showCropSelector ? (
                        <div className="flex w-full flex-col items-center gap-4">
                          <img
                            src={preview}
                            alt="Preview"
                            className="max-h-64 rounded-2xl border-2 border-primary-200 object-contain shadow-md"
                          />
                          <div className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700">
                            ✓ Area selected and ready
                          </div>
                          <div className="text-sm text-slate-600">
                            <p className="font-medium">{selectedFile?.name}</p>
                            {selectedFile && (
                              <p className="text-xs text-slate-500">
                                {formatFileSize(selectedFile.size)}
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm" type="button" onClick={() => open()}>
                            Change image
                          </Button>
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
                          <p className="text-xs text-slate-500">JPG, PNG, or WebP · up to 10MB</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Options Section */}
              {selectedFile && !result && !showCropSelector && preview && (
                <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/70">
                  <div className="border-b border-slate-200/70 p-8">
                    <h2 className="text-2xl font-semibold text-slate-900">Step 2 · Customize settings</h2>
                    <p className="mt-1 text-sm text-slate-500">Adjust these settings to match your preferences</p>
                  </div>

                  <div className="space-y-6 p-8">
                    {/* Canvas Size */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-3">Canvas Size</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'small', label: 'Small', desc: '~40x40' },
                          { value: 'medium', label: 'Medium', desc: '~60x60' },
                          { value: 'large', label: 'Large', desc: '~80x80' },
                          { value: 'xlarge', label: 'X-Large', desc: '~100x100' },
                        ].map((size) => (
                          <button
                            key={size.value}
                            onClick={() => setCanvasSize(size.value as any)}
                            className={`rounded-lg border-2 p-4 text-left transition-all ${
                              canvasSize === size.value
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-slate-200 hover:border-primary-200'
                            }`}
                          >
                            <div className="font-semibold text-slate-900">{size.label}</div>
                            <div className="text-xs text-slate-500">{size.desc} diamonds</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-3">Quality</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'standard', label: 'Standard', colors: '30 colors' },
                          { value: 'high', label: 'High', colors: '40 colors' },
                          { value: 'ultra', label: 'Ultra', colors: '50 colors' },
                        ].map((q) => (
                          <button
                            key={q.value}
                            onClick={() => setQuality(q.value as any)}
                            className={`rounded-lg border-2 p-4 text-center transition-all ${
                              quality === q.value
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-slate-200 hover:border-primary-200'
                            }`}
                          >
                            <div className="font-semibold text-slate-900">{q.label}</div>
                            <div className="text-xs text-slate-500">{q.colors}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Drill Shape */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-3">Diamond Shape</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'square', label: 'Square', desc: 'More coverage' },
                          { value: 'round', label: 'Round', desc: 'Classic sparkle' },
                        ].map((shape) => (
                          <button
                            key={shape.value}
                            onClick={() => setDrillShape(shape.value as any)}
                            className={`rounded-lg border-2 p-4 text-left transition-all ${
                              drillShape === shape.value
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-slate-200 hover:border-primary-200'
                            }`}
                          >
                            <div className="font-semibold text-slate-900">{shape.label}</div>
                            <div className="text-xs text-slate-500">{shape.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generate Button */}
                    <div className="pt-4">
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="h-12 w-full text-base"
                      >
                        {isGenerating ? '✨ Generating...' : '💎 Generate Diamond Painting'}
                      </Button>
                      {isGenerating && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                            <span>Processing...</span>
                            <span>{generationProgress}%</span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-3 rounded-full bg-primary-500 transition-all duration-300 ease-out"
                              style={{ width: `${generationProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Result */}
            <div className="space-y-8">
              {!result ? (
                <div className="rounded-3xl bg-white/80 p-8 shadow-lg ring-1 ring-slate-200/70">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">What you'll receive</h3>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-primary-500">✓</span>
                      <span>High-resolution pixelated pattern ready for diamond painting</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-primary-500">✓</span>
                      <span>Complete DMC color chart with exact color codes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-primary-500">✓</span>
                      <span>Detailed materials list with diamond quantities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-primary-500">✓</span>
                      <span>Step-by-step instructions and pro tips</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-primary-500">✓</span>
                      <span>Difficulty rating and estimated completion time</span>
                    </li>
                  </ul>

                  <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-primary-500/10 p-6">
                    <h4 className="font-semibold text-slate-900 mb-2">Why Diamond Painting?</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>• <strong>Easier than painting</strong> - No mixing colors or brush skills needed</li>
                      <li>• <strong>Stunning sparkle</strong> - Creates eye-catching mosaic effect</li>
                      <li>• <strong>Therapeutic</strong> - Relaxing, meditative process</li>
                      <li>• <strong>No mess</strong> - Clean, organized crafting experience</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pattern Preview */}
                  <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/70">
                    <div className="border-b border-slate-200/70 p-8">
                      <h2 className="text-2xl font-semibold text-slate-900">Your Diamond Painting Pattern</h2>
                      <p className="mt-1 text-sm text-slate-500">Download the pattern and materials list below</p>
                    </div>

                    <div className="p-8">
                      <img
                        src={result.imageDataUrl}
                        alt="Diamond painting pattern"
                        className="w-full rounded-2xl border-2 border-primary-200 shadow-lg"
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/70 p-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Pattern Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-slate-50 p-4 border-2 border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold uppercase">Dimensions</div>
                        <div className="text-xl font-bold text-slate-900 mt-1">
                          {result.dimensions.width} × {result.dimensions.height}
                        </div>
                        <div className="text-xs text-slate-500">diamonds</div>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-4 border-2 border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold uppercase">Total Diamonds</div>
                        <div className="text-xl font-bold text-slate-900 mt-1">
                          {result.estimatedDiamonds.toLocaleString()}
                        </div>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-4 border-2 border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold uppercase">Colors Used</div>
                        <div className="text-xl font-bold text-slate-900 mt-1">
                          {result.colorsUsed.length} DMC
                        </div>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-4 border-2 border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold uppercase">Difficulty</div>
                        <div className={`text-xl font-bold mt-1 ${
                          result.difficulty === 'Easy' ? 'text-green-600' :
                          result.difficulty === 'Medium' ? 'text-yellow-600' :
                          result.difficulty === 'Hard' ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {result.difficulty}
                        </div>
                      </div>

                      <div className="col-span-2 rounded-lg bg-primary-50 p-4 border-2 border-primary-200">
                        <div className="text-xs text-primary-700 font-semibold uppercase">Estimated Time</div>
                        <div className="text-xl font-bold text-primary-900 mt-1">
                          {result.estimatedTime}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download Buttons */}
                  <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/70 p-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Download Your Files</h3>
                    <div className="space-y-3">
                      <Button onClick={handleDownloadPattern} variant="outline" className="w-full">
                        📥 Download Pattern Image
                      </Button>
                      <Button onClick={handleDownloadMaterials} variant="outline" className="w-full">
                        📋 Download Materials List (HTML)
                      </Button>
                      <Button onClick={handlePrintMaterials} variant="outline" className="w-full">
                        🖨️ Print Materials List
                      </Button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <Button onClick={() => window.location.reload()} className="w-full">
                        ✨ Create Another Pattern
                      </Button>
                    </div>
                  </div>

                  {/* Color Legend Preview */}
                  <div className="rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/70 p-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">DMC Colors Used</h3>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {result.colorsUsed.slice(0, 10).map((color) => (
                          <div key={color.dmcColor.code} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <div
                              className="w-10 h-10 rounded border-2 border-slate-300"
                              style={{ backgroundColor: color.dmcColor.hex }}
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900">DMC {color.dmcColor.code}</div>
                              <div className="text-xs text-slate-500">{color.dmcColor.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-slate-900">{color.count}</div>
                              <div className="text-xs text-slate-500">{color.percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        ))}
                        {result.colorsUsed.length > 10 && (
                          <div className="text-center text-sm text-slate-500 py-2">
                            + {result.colorsUsed.length - 10} more colors (see materials list)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
