'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTemplate } from '@/lib/hooks'
import { apiClient, KitBundle } from '@/lib/api'

export default function PreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const templateId = parseInt(params.id)
  const { data: template, isLoading } = useTemplate(templateId)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [showComparison, setShowComparison] = useState(false)
  const [kitBundles, setKitBundles] = useState<KitBundle[]>([])
  const [loadingKits, setLoadingKits] = useState(true)
  const [recommendedKit, setRecommendedKit] = useState<any>(null)

  // Fetch kit bundles from API
  useEffect(() => {
    const fetchKits = async () => {
      try {
        setLoadingKits(true)
        const kits = await apiClient.listKitBundles()
        setKitBundles(kits)

        // Set most popular kit as default
        const popularKit = kits.find(k => k.is_popular)
        if (popularKit) {
          setSelectedProduct(popularKit.sku)
        } else if (kits.length > 0) {
          setSelectedProduct(kits[0].sku)
        }
      } catch (error) {
        console.error('Failed to fetch kit bundles:', error)
      } finally {
        setLoadingKits(false)
      }
    }

    fetchKits()
  }, [])

  // Get recommendations when template loads
  useEffect(() => {
    const fetchRecommendation = async () => {
      if (template) {
        try {
          const recommendation = await apiClient.recommendBundle({
            template_format: template.paper_format || 'a4',
            difficulty_level: template.difficulty_level || 'intermediate'
          })
          setRecommendedKit(recommendation)
        } catch (error) {
          console.error('Failed to fetch recommendation:', error)
        }
      }
    }

    fetchRecommendation()
  }, [template])

  const handleAddToCart = () => {
    const selectedKit = kitBundles.find(k => k.sku === selectedProduct)

    if (!selectedKit) {
      alert('Please select a kit bundle')
      return
    }

    // Add to cart logic
    const cartItem = {
      templateId: template?.id,
      kitSku: selectedKit.sku,
      kitBundle: {
        id: selectedKit.id,
        sku: selectedKit.sku,
        name: selectedKit.display_name,
        price: selectedKit.total_price,
        description: selectedKit.description,
        includes_frame: selectedKit.includes_frame,
        includes_paints: selectedKit.includes_paints,
        includes_brushes: selectedKit.includes_brushes,
        includes_canvas: selectedKit.includes_canvas,
      },
      template: {
        id: template?.id,
        title: template?.title,
        preview_url: template?.template_url,
        difficulty_level: template?.difficulty_level,
        num_colors: template?.num_colors,
      }
    }

    // Store in localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cart.push(cartItem)
    localStorage.setItem('cart', JSON.stringify(cart))

    router.push('/cart')
  }

  const getDifficultyInfo = (level?: string) => {
    const map: Record<string, { emoji: string; color: string }> = {
      'Very Easy': { emoji: '🟢', color: 'text-green-600' },
      'Easy': { emoji: '🟢', color: 'text-green-600' },
      'Medium': { emoji: '🟡', color: 'text-yellow-600' },
      'Hard': { emoji: '🟠', color: 'text-orange-600' },
      'Very Hard': { emoji: '🔴', color: 'text-red-600' },
      'Expert': { emoji: '🔴', color: 'text-red-600' },
    }
    return level ? map[level] : { emoji: '⚪', color: 'text-gray-600' }
  }

  if (isLoading || loadingKits) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading your template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Template not found</p>
          <Link href="/create">
            <Button className="mt-4">Create New Template</Button>
          </Link>
        </div>
      </div>
    )
  }

  const difficultyInfo = getDifficultyInfo(template.difficulty_level)
  const selectedKit = kitBundles.find(k => k.sku === selectedProduct)

  // Helper function to build kit features list
  const getKitFeatures = (kit: KitBundle): string[] => {
    const features: string[] = []

    if (kit.includes_canvas) {
      const format = kit.paper_format.toUpperCase()
      features.push(`Pre-printed ${format} canvas`)
    }

    if (kit.includes_paints) {
      const paintType = kit.paint_set_type?.replace('_', ' ') || 'paint set'
      features.push(`${paintType} paint set`)
    }

    if (kit.includes_brushes) {
      features.push(`${kit.brush_count} professional brushes`)
    }

    if (kit.includes_frame) {
      const frameType = kit.frame_type?.replace('_', ' ') || 'frame'
      features.push(`${frameType} frame`)
    }

    if (!kit.includes_canvas && !kit.includes_paints && !kit.includes_brushes && !kit.includes_frame) {
      features.push('High-resolution PDF template')
      features.push('Color legend & guide')
      features.push('Instant download')
    }

    if (kit.total_price >= 49.99) {
      features.push('Free shipping')
    }

    features.push('Includes color legend')

    return features
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
                <Button variant="outline">🛒 Cart</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <h3 className="font-semibold text-green-900">Your Template is Ready!</h3>
              <p className="text-sm text-green-700">Choose your format and order now to start painting</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Preview Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Paint by Numbers Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <img
                    src={showComparison ? template.comparison_url : template.template_url}
                    alt="Template Preview"
                    className="w-full rounded-lg shadow-lg"
                  />
                  <div className="absolute top-4 right-4 space-x-2">
                    <Button
                      size="sm"
                      variant={!showComparison ? 'primary' : 'outline'}
                      onClick={() => setShowComparison(false)}
                    >
                      Template
                    </Button>
                    <Button
                      size="sm"
                      variant={showComparison ? 'primary' : 'outline'}
                      onClick={() => setShowComparison(true)}
                    >
                      Compare
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Info */}
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Difficulty</p>
                  <p className={`text-lg font-semibold ${difficultyInfo.color}`}>
                    {difficultyInfo.emoji} {template.difficulty_level}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Colors</p>
                  <p className="text-lg font-semibold">{template.num_colors} colors</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quality Score</p>
                  <p className="text-lg font-semibold">{template.quality_score?.toFixed(0)}/100</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Est. Time</p>
                  <p className="text-lg font-semibold">{template.estimated_time || '5-8 hours'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Color Legend Preview */}
            {template.legend_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Color Legend</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={template.legend_url}
                    alt="Color Legend"
                    className="w-full rounded-lg"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Kit</CardTitle>
                {recommendedKit && (
                  <p className="text-sm text-gray-600 mt-2">
                    💡 {recommendedKit.reason}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {kitBundles.map((kit) => {
                  const features = getKitFeatures(kit)
                  return (
                    <div
                      key={kit.sku}
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedProduct === kit.sku
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                      onClick={() => setSelectedProduct(kit.sku)}
                    >
                      {kit.is_popular && (
                        <div className="absolute -top-3 left-4 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Most Popular
                        </div>
                      )}
                      {recommendedKit?.recommended_kit?.sku === kit.sku && (
                        <div className="absolute -top-3 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Recommended
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{kit.display_name}</h3>
                          <p className="text-sm text-gray-600">{kit.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-600">${kit.total_price.toFixed(2)}</p>
                          {kit.discount_percentage > 0 && (
                            <p className="text-xs text-green-600">Save {kit.discount_percentage}%</p>
                          )}
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1">
                        {features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className="text-primary-600 mr-2">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedKit ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Product:</span>
                      <span className="font-medium">{selectedKit.display_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Format:</span>
                      <span className="font-medium">{selectedKit.paper_format.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Processing:</span>
                      <span className="text-green-600">
                        {selectedKit.includes_canvas ? '2-3 business days' : 'Instant download'}
                      </span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary-600">${selectedKit.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleAddToCart}
                    >
                      Add to Cart
                    </Button>
                    <p className="text-xs text-center text-gray-500">
                      🔒 Secure checkout • 30-day money-back guarantee
                    </p>
                  </>
                ) : (
                  <p className="text-center text-gray-500">Please select a kit bundle</p>
                )}
              </CardContent>
            </Card>

            {/* Alternatives */}
            {recommendedKit?.alternatives && recommendedKit.alternatives.length > 0 && (
              <Card className="bg-blue-50">
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    💡 Other Options:
                  </p>
                  {recommendedKit.alternatives.map((alt: any, idx: number) => {
                    const altKit = kitBundles.find(k => k.sku === alt.sku)
                    return altKit ? (
                      <div
                        key={idx}
                        className="bg-white rounded-lg p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedProduct(alt.sku)}
                      >
                        <p className="text-sm font-medium">{altKit.display_name}</p>
                        <p className="text-xs text-gray-600">{alt.reason}</p>
                        <p className="text-sm font-bold text-primary-600 mt-1">
                          ${altKit.total_price.toFixed(2)}
                        </p>
                      </div>
                    ) : null
                  })}
                </CardContent>
              </Card>
            )}

            {/* Not Happy? */}
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Not happy with the result?</strong>
                </p>
                <Link href="/create">
                  <Button variant="outline" className="w-full">
                    Try a Different Image
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
