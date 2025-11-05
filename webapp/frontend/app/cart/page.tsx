'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface PaintKit {
  id: string
  name: string
  displayName: string
  price: number
  numColors: number
  palette: string
  sku: string
  quantity: number
}

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<PaintKit[]>([])
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA'
  })

  useEffect(() => {
    // Load cart from localStorage (paintKitsCart from shop page)
    const cart = JSON.parse(localStorage.getItem('paintKitsCart') || '[]')
    setCartItems(cart)
  }, [])

  const removeItem = (kitId: string) => {
    const newCart = cartItems.filter(item => item.id !== kitId)
    setCartItems(newCart)
    localStorage.setItem('paintKitsCart', JSON.stringify(newCart))
  }

  const updateQuantity = (kitId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(kitId)
      return
    }
    const newCart = cartItems.map(item =>
      item.id === kitId ? { ...item, quantity: newQuantity } : item
    )
    setCartItems(newCart)
    localStorage.setItem('paintKitsCart', JSON.stringify(newCart))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = subtotal >= 50 ? 0 : 7.99 // Free shipping over $50
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + shipping + tax

  const handleCheckout = () => {
    // Validate inputs
    if (!email || cartItems.length === 0) {
      alert('Please fill in your email address')
      return
    }

    if (!shippingAddress.name || !shippingAddress.address || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip) {
      alert('Please fill in complete shipping address')
      return
    }

    // Store cart in session for checkout page
    sessionStorage.setItem('checkout_cart', JSON.stringify({
      items: cartItems,
      subtotal,
      tax,
      shipping,
      total
    }))

    // Redirect to checkout page
    router.push('/checkout')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-slate-900 hover:text-primary-600 transition-colors">
              🎨 Paint by Numbers AI
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/shop">
                <Button variant="ghost">Shop Kits</Button>
              </Link>
              <Link href="/create">
                <Button variant="ghost">Create Template</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Shopping Cart</h1>
        <p className="text-slate-600 mb-8">Review your items and proceed to checkout</p>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add paint kits to get started!</p>
            <Link href="/shop">
              <Button size="lg" className="text-lg px-8">
                Browse Paint Kits
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-6 items-start">
                      {/* Icon/Image */}
                      <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                        🎨
                      </div>

                      {/* Details */}
                      <div className="flex-grow">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{item.displayName}</h3>
                        <p className="text-sm text-gray-600 mb-2">{item.numColors} premium acrylic colors</p>
                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-sm font-medium text-gray-700">Quantity:</span>
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-3 py-1 hover:bg-gray-100 text-gray-600 font-semibold"
                            >
                              −
                            </button>
                            <span className="px-4 py-1 border-x border-gray-300 font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1 hover:bg-gray-100 text-gray-600 font-semibold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Price & Remove */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600 mb-2">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          ${item.price.toFixed(2)} each
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:bg-red-50 text-sm"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    {/* Benefits Banner */}
                    <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200">
                      <p className="text-sm font-semibold text-primary-900">
                        ✨ Includes: Unlimited Template Generation Forever!
                      </p>
                      <p className="text-xs text-primary-700 mt-1">
                        Generate as many custom templates as you want with this kit
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">For order confirmation and template access</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <Input
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <Input
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                      placeholder="123 Main St, Apt 4B"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <Input
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        placeholder="New York"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <Input
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        placeholder="NY"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code *
                      </label>
                      <Input
                        value={shippingAddress.zip}
                        onChange={(e) => setShippingAddress({...shippingAddress, zip: e.target.value})}
                        placeholder="10001"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <Input
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                        disabled
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="text-2xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {subtotal < 50 && subtotal > 0 && (
                    <div className="text-xs text-gray-500 -mt-2">
                      Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-slate-900">Total</span>
                      <span className="text-3xl font-bold text-primary-600">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-14 text-lg font-semibold"
                    size="lg"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout →
                  </Button>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>🔒</span>
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>💝</span>
                      <span>30-day money-back guarantee</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>🚚</span>
                      <span>Ships within 24 hours</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>♾️</span>
                      <span>Unlimited template generation</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-600 mb-2">
                      <strong>What happens next:</strong>
                    </p>
                    <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Complete checkout & payment</li>
                      <li>Receive order confirmation</li>
                      <li>Kit ships within 24 hours</li>
                      <li>Start generating templates!</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4 text-center">
                <Link href="/shop" className="text-sm text-primary-600 hover:underline">
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
