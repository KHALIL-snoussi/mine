'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useTemplate } from '@/lib/hooks'

// Product options
const PRODUCT_OPTIONS = [
  {
    id: 'digital_pdf',
    name: 'Digital PDF Kit',
    description: 'Download and print at home',
    price: 19.99,
    features: [
      'High-resolution PDF template',
      'Color legend & guide',
      'Print on any size paper',
      'Instant download'
    ],
    popular: false,
  },
  {
    id: 'printed_canvas',
    name: 'Printed Canvas Kit',
    description: 'Ready-to-paint canvas with paints',
    price: 49.99,
    features: [
      'Pre-printed canvas (16x20")',
      'Complete paint set',
      '3 professional brushes',
      'Free shipping',
      'Includes color legend'
    ],
    popular: true,
  },
  {
    id: 'premium_canvas',
    name: 'Premium Canvas Kit',
    description: 'Deluxe kit with frame',
    price: 89.99,
    features: [
      'Large canvas (24x30")',
      'Premium paint set',
      '5 artist-grade brushes',
      'Wooden display frame',
      'Free express shipping',
      'Color mixing guide'
    ],
    popular: false,
  },
]

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const templateId = parseInt(resolvedParams.id)
  const { data: template, isLoading } = useTemplate(templateId)
  const [selectedProduct, setSelectedProduct] = useState('printed_canvas')
  const [showComparison, setShowComparison] = useState(false)

  const handleAddToCart = () => {
    // Add to cart logic
    const cartItem = {
      templateId: template?.id,
      productId: selectedProduct,
      product: PRODUCT_OPTIONS.find(p => p.id === selectedProduct),
      template: {
        title: template?.title,
        preview_url: template?.template_url,
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

  if (isLoading) {
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
  const selectedProductDetails = PRODUCT_OPTIONS.find(p => p.id === selectedProduct)

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
                <CardTitle>Choose Your Format</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {PRODUCT_OPTIONS.map((product) => (
                  <div
                    key={product.id}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedProduct === product.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => setSelectedProduct(product.id)}
                  >
                    {product.popular && (
                      <div className="absolute -top-3 left-4 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Most Popular
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">${product.price}</p>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start">
                          <span className="text-primary-600 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium">{selectedProductDetails?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Processing:</span>
                  <span className="text-green-600">2-3 business days</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary-600">${selectedProductDetails?.price}</span>
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
              </CardContent>
            </Card>

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
