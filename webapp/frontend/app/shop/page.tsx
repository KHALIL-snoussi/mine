'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// Paint Kit data (from your paint_kits.py)
const PAINT_KITS = [
  {
    id: 'starter_kit',
    name: 'Starter Kit',
    displayName: 'Paint by Numbers - Starter Kit',
    price: 24.99,
    numColors: 12,
    palette: 'classic_12',
    sku: 'PBN-START-12',
    difficulty: 'Easy',
    target: 'Beginners, Kids (8+), Gift Buyers',
    estimatedProjects: 3,
    bestFor: ['First-time painters', 'Simple portraits', 'Children\'s projects', 'Quick weekend projects'],
    includes: [
      '12 premium acrylic paint bottles (30ml each)',
      '3 quality paint brushes (fine, medium, broad)',
      'Printed color reference card',
      'Step-by-step instruction guide',
      'Bonus: Digital templates access'
    ],
    badge: null,
    gradient: 'from-blue-500/10 to-indigo-500/10'
  },
  {
    id: 'creative_kit',
    name: 'Creative Kit',
    displayName: 'Paint by Numbers - Creative Kit',
    price: 39.99,
    numColors: 18,
    palette: 'classic_18',
    sku: 'PBN-CREATE-18',
    difficulty: 'Intermediate',
    target: 'Hobbyists, Art Enthusiasts',
    estimatedProjects: 5,
    bestFor: ['Detailed portraits', 'Landscape paintings', 'Pet portraits', 'Home decor projects'],
    includes: [
      '18 premium acrylic paint bottles (30ml each)',
      '5 quality paint brushes (various sizes)',
      'Color mixing guide',
      'Printed color reference card',
      'Palette tray for mixing',
      'Premium: 10 digital template credits'
    ],
    badge: 'Most Popular',
    gradient: 'from-primary-500/10 to-secondary-500/10'
  },
  {
    id: 'professional_kit',
    name: 'Professional Kit',
    displayName: 'Paint by Numbers - Professional Kit',
    price: 59.99,
    numColors: 24,
    palette: 'classic_24',
    sku: 'PBN-PRO-24',
    difficulty: 'Advanced',
    target: 'Advanced Painters, Professional Artists',
    estimatedProjects: 10,
    bestFor: ['Complex artwork', 'Gallery-quality pieces', 'Commission work', 'Multiple large projects'],
    includes: [
      '24 professional acrylic paint bottles (50ml each)',
      '8 premium paint brushes (complete range)',
      'Advanced color mixing guide',
      'Professional color reference poster',
      'Large palette tray',
      'Paint storage organizer',
      'Premium: Unlimited digital templates for 1 year'
    ],
    badge: 'Best Value',
    gradient: 'from-purple-500/10 to-pink-500/10'
  },
  {
    id: 'pastel_dreams_kit',
    name: 'Pastel Dreams',
    displayName: 'Paint by Numbers - Pastel Dreams Edition',
    price: 29.99,
    numColors: 12,
    palette: 'pastel_12',
    sku: 'PBN-PASTEL-12',
    difficulty: 'Easy',
    target: 'Nursery Decorators, Soft Aesthetic',
    estimatedProjects: 4,
    bestFor: ['Baby nursery art', 'Soft portraits', 'Floral artwork', 'Wedding gifts'],
    includes: [
      '12 premium pastel acrylic paints (30ml each)',
      '3 soft-bristle brushes',
      'Pastel color guide',
      'Printed reference card',
      'Bonus: 5 pastel-themed templates'
    ],
    badge: 'New',
    gradient: 'from-pink-500/10 to-rose-500/10'
  },
  {
    id: 'nature_collection_kit',
    name: 'Nature Collection',
    displayName: 'Paint by Numbers - Nature Collection',
    price: 34.99,
    numColors: 15,
    palette: 'nature_15',
    sku: 'PBN-NATURE-15',
    difficulty: 'Intermediate',
    target: 'Nature Lovers, Outdoor Enthusiasts',
    estimatedProjects: 4,
    bestFor: ['Landscape paintings', 'Wildlife portraits', 'Forest scenes', 'Beach artwork'],
    includes: [
      '15 nature-inspired acrylic paints (30ml each)',
      '4 landscape brushes',
      'Nature color mixing guide',
      'Outdoor scene templates (3 included)',
      'Color reference card'
    ],
    badge: null,
    gradient: 'from-green-500/10 to-emerald-500/10'
  },
  {
    id: 'vibrant_artist_kit',
    name: 'Vibrant Artist',
    displayName: 'Paint by Numbers - Vibrant Artist Edition',
    price: 42.99,
    numColors: 18,
    palette: 'vibrant_18',
    sku: 'PBN-VIBRANT-18',
    difficulty: 'Intermediate',
    target: 'Young Adults 18-35, Modern Art Fans',
    estimatedProjects: 5,
    bestFor: ['Pop art style', 'Modern portraits', 'Abstract designs', 'Colorful animals'],
    includes: [
      '18 vivid acrylic paints (40ml each)',
      '5 precision brushes',
      'Color theory guide',
      'Neon & metallic accent colors (2 bonus)',
      'Modern art templates (5 included)'
    ],
    badge: null,
    gradient: 'from-orange-500/10 to-red-500/10'
  },
]

export default function ShopPage() {
  const [selectedKit, setSelectedKit] = useState<string | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [addedKit, setAddedKit] = useState<string | null>(null)

  // Load cart count on mount
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartCount(cart.length)
  }, [])

  const addToCart = (kit: typeof PAINT_KITS[0]) => {
    // Get existing cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')

    // Check if kit already in cart
    const existingIndex = cart.findIndex((item: any) => item.id === kit.id)

    if (existingIndex >= 0) {
      // Update quantity
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1
    } else {
      // Add new item with standardized structure
      cart.push({
        id: kit.id,
        type: 'kit', // Identify as paint kit purchase
        name: kit.name,
        displayName: kit.displayName,
        price: kit.price,
        quantity: 1,
        sku: kit.sku,
        numColors: kit.numColors,
        palette: kit.palette,
        includes: kit.includes
      })
    }

    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart))
    setCartCount(cart.length)

    // Show feedback
    setAddedKit(kit.id)
    setTimeout(() => setAddedKit(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-slate-900 hover:text-primary-600 transition-colors">
              🎨 Paint by Numbers AI
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/create">
                <Button variant="ghost" size="sm">Create Template</Button>
              </Link>
              <Link href="/cart">
                <Button variant="outline" size="sm" className="relative">
                  🛒 Cart
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700 mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
            </span>
            Buy Once, Paint Forever!
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6">
            The Smart Way to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
              Paint By Numbers
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Buy one standardized paint kit. Generate <strong>unlimited custom templates</strong> that all work with the same colors. No more buying 23 different paints for each image!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
              <span className="text-2xl">🎨</span>
              <span className="font-medium">6 Professional Kits</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
              <span className="text-2xl">♾️</span>
              <span className="font-medium">Unlimited Templates</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
              <span className="text-2xl">💰</span>
              <span className="font-medium">Starting $24.99</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
              <span className="text-2xl">🚚</span>
              <span className="font-medium">Free Shipping $50+</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Why Our System Works Better
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-red-50 border border-red-200">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-xl font-bold text-red-900 mb-2">Old Way (Frustrating)</h3>
              <ul className="space-y-2 text-red-800">
                <li>• Upload photo → get 23 custom colors</li>
                <li>• Buy 23 different paint tubes (expensive!)</li>
                <li>• Next photo? 19 MORE different colors</li>
                <li>• End up with 50+ paint tubes</li>
                <li>• Confusing, wasteful, expensive 💸</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-primary-900 mb-2">Our Way (Smart)</h3>
              <ul className="space-y-2 text-primary-800">
                <li>• Buy ONE Creative Kit with 18 colors ($39.99)</li>
                <li>• Generate unlimited templates with SAME 18 colors</li>
                <li>• Paint 100 different photos with ONE kit!</li>
                <li>• Save money, reduce waste, simplify life</li>
                <li>• Smart, eco-friendly, affordable 🎉</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Paint Kits Grid */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Choose Your Perfect Kit
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Each kit is designed for a specific skill level and use case. All kits work with unlimited custom templates!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PAINT_KITS.map((kit) => (
              <div
                key={kit.id}
                className={`group relative rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200/70 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  kit.badge ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {/* Badge */}
                {kit.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    {kit.badge}
                  </div>
                )}

                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${kit.gradient} opacity-50 rounded-3xl`} />

                {/* Content */}
                <div className="relative">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      {kit.name}
                    </h3>
                    <div className="inline-flex items-center gap-2 bg-white/80 rounded-full px-3 py-1 text-xs font-semibold text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      {kit.difficulty} • {kit.numColors} Colors
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-slate-900">
                      ${kit.price}
                    </div>
                    <p className="text-sm font-bold text-primary-600 mt-2">
                      + Unlimited Template Generation
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      (Paint lasts ~{kit.estimatedProjects} large projects)
                    </p>
                  </div>

                  {/* Best For */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Perfect for:</h4>
                    <ul className="space-y-1 text-sm text-slate-600">
                      {kit.bestFor.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-primary-500">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Includes */}
                  <div className="mb-6 bg-white/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Kit includes:</h4>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {kit.includes.slice(0, 4).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary-500 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => addToCart(kit)}
                      className="w-full h-12 text-base font-semibold"
                      variant={kit.badge ? 'default' : 'outline'}
                      disabled={addedKit === kit.id}
                    >
                      {addedKit === kit.id ? (
                        <>✓ Added to Cart!</>
                      ) : (
                        <>🛒 Add to Cart - ${kit.price}</>
                      )}
                    </Button>

                    <Link href={`/create?kit=${kit.id}`} className="block">
                      <Button
                        variant="ghost"
                        className="w-full text-sm"
                      >
                        Try with This Kit First →
                      </Button>
                    </Link>
                  </div>

                  {/* SKU */}
                  <p className="text-center text-xs text-slate-400 mt-3">
                    SKU: {kit.sku}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Compare Paint Kits
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-4 font-semibold text-slate-700">Feature</th>
                  {['Starter', 'Creative', 'Professional'].map((name) => (
                    <th key={name} className="text-center p-4 font-semibold text-slate-700">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-4 text-slate-600">Number of Colors</td>
                  <td className="p-4 text-center">12</td>
                  <td className="p-4 text-center font-semibold text-primary-600">18</td>
                  <td className="p-4 text-center">24</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-600">Price</td>
                  <td className="p-4 text-center">$24.99</td>
                  <td className="p-4 text-center font-semibold text-primary-600">$39.99</td>
                  <td className="p-4 text-center">$59.99</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-600">
                    Paint Lasts For
                    <div className="text-xs text-slate-500">(Templates: Unlimited)</div>
                  </td>
                  <td className="p-4 text-center">~3 projects</td>
                  <td className="p-4 text-center font-semibold text-primary-600">~5 projects</td>
                  <td className="p-4 text-center">~10 projects</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-600">Paint Volume</td>
                  <td className="p-4 text-center">30ml</td>
                  <td className="p-4 text-center font-semibold text-primary-600">30ml</td>
                  <td className="p-4 text-center">50ml</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-600">Brushes Included</td>
                  <td className="p-4 text-center">3</td>
                  <td className="p-4 text-center font-semibold text-primary-600">5</td>
                  <td className="p-4 text-center">8</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-600">Difficulty Level</td>
                  <td className="p-4 text-center">Easy</td>
                  <td className="p-4 text-center font-semibold text-primary-600">Intermediate</td>
                  <td className="p-4 text-center">Advanced</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Subscriptions */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Save 25% with Subscriptions
            </h2>
            <p className="text-xl opacity-90">
              Get a paint kit + monthly templates + quarterly refills
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Creative Monthly */}
            <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold mb-2">Creative Monthly</h3>
              <div className="text-5xl font-bold mb-6">
                $29.99<span className="text-2xl text-slate-500">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-primary-500">✓</span>
                  Creative Kit on signup (18 colors)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-500">✓</span>
                  4 new premium templates monthly
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-500">✓</span>
                  Paint refills every quarter
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-500">✓</span>
                  10% discount on accessories
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-500">✓</span>
                  Priority support
                </li>
              </ul>
              <Button className="w-full h-12 text-base font-semibold">
                Start Subscription
              </Button>
              <p className="text-center text-sm text-slate-500 mt-4">
                Save 25% vs buying separately
              </p>
            </div>

            {/* Professional Unlimited */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 text-slate-900 rounded-3xl p-8 shadow-2xl ring-4 ring-yellow-300">
              <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold mb-4">
                Best Value
              </div>
              <h3 className="text-2xl font-bold mb-2">Professional Unlimited</h3>
              <div className="text-5xl font-bold mb-6">
                $49.99<span className="text-2xl text-slate-500">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-orange-500">✓</span>
                  Professional Kit on signup (24 colors)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-500">✓</span>
                  <strong>UNLIMITED</strong> templates monthly
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-500">✓</span>
                  Monthly paint refills
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-500">✓</span>
                  20% discount on all products
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-500">✓</span>
                  Custom template requests (1/mo)
                </li>
              </ul>
              <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white">
                Start Pro Subscription
              </Button>
              <p className="text-center text-sm text-slate-600 mt-4">
                Save 40% • Best for serious artists
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'Why fixed palettes instead of custom colors?',
                a: 'Fixed palettes mean you can buy ONE paint kit and use it for UNLIMITED templates. No more buying 20 different paint colors for each new image!'
              },
              {
                q: 'Can I really generate unlimited templates with one kit?',
                a: 'Yes! Our AI maps any photo to your chosen palette. Buy the Creative Kit once, generate 100 templates, paint them all with the same 18 colors.'
              },
              {
                q: 'What if my photo has colors not in the kit?',
                a: 'Our AI intelligently maps all colors to the nearest palette color. The result looks professional and is actually easier to paint!'
              },
              {
                q: 'Which kit should I choose?',
                a: 'Starter (12 colors): Beginners, simple projects. Creative (18 colors): Most popular, great balance. Professional (24 colors): Complex artwork, serious artists.'
              },
              {
                q: 'Do subscriptions save money?',
                a: 'Yes! Creative Monthly saves 25%, Professional Unlimited saves 40% vs buying separately. Plus you get quarterly/monthly paint refills.'
              }
            ].map((faq, idx) => (
              <details key={idx} className="group bg-white rounded-xl p-6 shadow-sm ring-1 ring-slate-200">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900">
                  {faq.q}
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-slate-600">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Painting Smarter?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Choose your kit, generate unlimited templates, and start creating beautiful artwork today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-4">
                Try Free Template First
              </Button>
            </Link>
            <a href="#kits" onClick={(e) => {e.preventDefault(); document.querySelector('.grid.md\\:grid-cols-2')?.parentElement?.scrollIntoView({behavior: 'smooth'})}}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                View All Kits
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm opacity-75">
            🎁 Free shipping on orders $50+ • 💝 30-day money-back guarantee • ✨ No subscription required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Paint by Numbers AI</h3>
              <p className="text-sm">
                The smart way to create custom paint-by-numbers with standardized kits.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#kits" className="hover:text-white">Paint Kits</a></li>
                <li><Link href="/create" className="hover:text-white">Create Template</Link></li>
                <li><a href="#subscriptions" className="hover:text-white">Subscriptions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/shipping" className="hover:text-white">Shipping</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; 2025 Paint by Numbers AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
