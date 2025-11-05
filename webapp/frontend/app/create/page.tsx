'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { usePalettes, useModels } from '@/lib/hooks'
import Link from 'next/link'
import { apiClient } from '@/lib/api'

export default function CreatePage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedPalette, setSelectedPalette] = useState('classic_18')
  const [selectedModel, setSelectedModel] = useState('classic')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTemplateId, setGeneratedTemplateId] = useState<number | null>(null)

  const { data: palettesData } = usePalettes()
  const { data: modelsData } = useModels()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setGeneratedTemplateId(null)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
  })

  const handleGenerate = async () => {
    if (!selectedFile) return

    setIsGenerating(true)
    try {
      const template = await apiClient.generateTemplate(selectedFile, {
        palette_name: selectedPalette,
        model: selectedModel,
        title: 'Preview Template',
      })

      setGeneratedTemplateId(template.id)
      // Redirect to preview page
      router.push(`/preview/${template.id}`)
    } catch (error) {
      console.error('Generation failed:', error)
      alert('Generation failed. Please try again.')
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Paint by Numbers
          </h1>
          <p className="text-xl text-gray-600">
            Upload your photo, preview the result, and order your custom kit
          </p>
          <p className="text-sm text-primary-600 mt-2">
            No account needed • Free preview • Order in minutes
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Upload Your Photo</CardTitle>
                <CardDescription>
                  Choose a high-quality image for best results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary-500 bg-primary-50'
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
                      <p className="text-sm text-gray-600">{selectedFile?.name}</p>
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
                        PNG, JPG, JPEG up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Choose Your Style</CardTitle>
                <CardDescription>
                  Select a color palette (AI will optimize it for you)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Palette Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Palette
                  </label>
                  <select
                    value={selectedPalette}
                    onChange={(e) => setSelectedPalette(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {palettesData?.map((palette) => (
                      <option key={palette.name} value={palette.name}>
                        {palette.display_name} ({palette.num_colors} colors)
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    💡 Our AI will automatically select the best palette for your image
                  </p>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedFile || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating
                    ? 'Creating Preview...'
                    : '✨ Generate Preview (Free)'}
                </Button>

                {isGenerating && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-700">
                      ⏳ This takes 30-60 seconds. We're analyzing colors and creating your template...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What You Get */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>What You'll Get</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    High-quality numbered template
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    Color legend with paint codes
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    Step-by-step painting guide
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    Reference image for comparison
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    Professional quality PDF kit
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                1
              </div>
              <h3 className="font-semibold mb-1">Upload</h3>
              <p className="text-sm text-gray-600">Upload your favorite photo</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                2
              </div>
              <h3 className="font-semibold mb-1">Preview</h3>
              <p className="text-sm text-gray-600">See the result instantly</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                3
              </div>
              <h3 className="font-semibold mb-1">Order</h3>
              <p className="text-sm text-gray-600">Choose your format and order</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                4
              </div>
              <h3 className="font-semibold mb-1">Paint</h3>
              <p className="text-sm text-gray-600">Receive and start painting!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
