'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface CartItem {
  id: string
  name: string
  displayName: string
  price: number
  quantity: number
  sku: string
}

interface CheckoutCart {
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CheckoutCart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Customer info
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Shipping address
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState('United States')

  // Payment info (for demo/test mode)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')

  useEffect(() => {
    // Load cart from session
    const checkoutCart = sessionStorage.getItem('checkout_cart')
    if (!checkoutCart) {
      router.push('/cart')
      return
    }

    setCart(JSON.parse(checkoutCart))
  }, [router])

  const validateForm = () => {
    if (!email || !name) {
      setError('Please fill in all required fields')
      return false
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }

    if (!address || !city || !state || !zip) {
      setError('Please fill in complete shipping address')
      return false
    }

    // Basic card validation
    if (!cardNumber || !cardExpiry || !cardCvc) {
      setError('Please fill in complete payment information')
      return false
    }

    // Check card number length (basic validation)
    const cleanCard = cardNumber.replace(/\s/g, '')
    if (cleanCard.length < 15 || cleanCard.length > 16) {
      setError('Please enter a valid card number')
      return false
    }

    // Check expiry format (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setError('Card expiry must be in MM/YY format')
      return false
    }

    // Check CVC length
    if (cardCvc.length < 3 || cardCvc.length > 4) {
      setError('Please enter a valid CVC code')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return
    if (!cart) return

    setLoading(true)

    try {
      // In production, this would call your backend API to process payment via Stripe
      // For now, we'll simulate the process

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create order object
      const order = {
        orderId: 'ORD-' + Date.now(),
        customer: {
          email,
          name,
          phone,
        },
        shipping: {
          address,
          city,
          state,
          zip,
          country,
        },
        items: cart.items,
        payment: {
          subtotal: cart.subtotal,
          tax: cart.tax,
          shipping: cart.shipping,
          total: cart.total,
          method: 'card',
          last4: cardNumber.slice(-4),
        },
        status: 'confirmed',
        date: new Date().toISOString(),
      }

      // Store order in localStorage (in production, this would be in database)
      const orders = JSON.parse(localStorage.getItem('orders') || '[]')
      orders.push(order)
      localStorage.setItem('orders', JSON.stringify(orders))

      // Clear cart
      localStorage.removeItem('cart')
      sessionStorage.removeItem('checkout_cart')

      // Redirect to success page
      sessionStorage.setItem('last_order', JSON.stringify(order))
      router.push('/checkout/success')

    } catch (err) {
      setError('Payment failed. Please try again.')
      setLoading(false)
    }
  }

  if (!cart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-slate-900">
              🎨 Paint by Numbers AI
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-primary-600 font-medium">🔒 Secure Checkout</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-medium">
              ✓
            </div>
            <span className="text-sm font-medium text-slate-600">Cart</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
              2
            </div>
            <span className="text-sm font-medium text-primary-600">Checkout</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-300 text-white flex items-center justify-center font-medium">
              3
            </div>
            <span className="text-sm font-medium text-slate-400">Complete</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">Order confirmation will be sent here</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Street Address *
                    </label>
                    <Input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main Street, Apt 4B"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        City *
                      </label>
                      <Input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="New York"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        State *
                      </label>
                      <Input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="NY"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        ZIP Code *
                      </label>
                      <Input
                        type="text"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="10001"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Country
                      </label>
                      <Input
                        type="text"
                        value={country}
                        disabled
                        className="bg-slate-100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span>Payment Information</span>
                    <span className="text-xs font-normal text-slate-500">🔒 Secured by Stripe</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Test Mode:</strong> Use card <code className="bg-white px-1 rounded">4242 4242 4242 4242</code> with any future date and any 3-digit CVC.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Card Number *
                    </label>
                    <Input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => {
                        // Format card number with spaces
                        const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
                        setCardNumber(value)
                      }}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Expiry Date *
                      </label>
                      <Input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => {
                          // Format as MM/YY
                          let value = e.target.value.replace(/\D/g, '')
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + '/' + value.slice(2, 4)
                          }
                          setCardExpiry(value)
                        }}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        CVC *
                      </label>
                      <Input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-6" />
                    <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-6" />
                    <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" className="h-6" />
                    <img src="https://js.stripe.com/v3/fingerprinted/img/discover-ac52cd46f89fa40a29a0bfb954e33173.svg" alt="Discover" className="h-6" />
                  </div>
                </CardContent>
              </Card>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">❌ {error}</p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-lg font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Processing Payment...
                  </span>
                ) : (
                  <span>Complete Order - ${cart.total.toFixed(2)}</span>
                )}
              </Button>

              <p className="text-xs text-center text-slate-500">
                By completing this purchase, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {cart.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-slate-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium">${cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-medium text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax</span>
                    <span className="font-medium">${cart.tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary-600">
                      ${cart.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <span>✅</span>
                    <span>30-day money-back guarantee</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <span>✅</span>
                    <span>Free shipping on all orders</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <span>✅</span>
                    <span>Secure 256-bit SSL encryption</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 text-center">
              <Link href="/cart" className="text-sm text-primary-600 hover:underline font-medium">
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
