'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface CartItem {
  id: string
  type: 'kit'
  name: string
  displayName: string
  price: number
  quantity: number
  sku: string
  numColors?: number
  palette?: string
  includes?: string[]
}

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    // Load cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartItems(cart)
  }, [])

  const removeItem = (index: number) => {
    const newCart = cartItems.filter((_, i) => i !== index)
    setCartItems(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    const newCart = [...cartItems]
    newCart[index].quantity = newQuantity
    setCartItems(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = 0 // Free shipping!
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + shipping + tax

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty')
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
                <Button variant="ghost" size="sm">Shop Kits</Button>
              </Link>
              <Link href="/create">
                <Button variant="ghost" size="sm">Create Template</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Shopping Cart</h1>
        <p className="text-slate-600 mb-8">Review your items and proceed to checkout</p>

        {cartItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="text-7xl mb-6">🛒</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Your cart is empty</h2>
            <p className="text-lg text-slate-600 mb-8">Start by choosing a paint kit for your projects!</p>
            <Link href="/shop">
              <Button size="lg" className="mr-4">Shop Paint Kits</Button>
            </Link>
            <Link href="/create">
              <Button size="lg" variant="outline">Create Template</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Product Icon */}
                      <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-4xl">🎨</span>
                      </div>

                      {/* Product Info */}
                      <div className="flex-grow">
                        <h3 className="font-bold text-xl text-slate-900 mb-1">{item.displayName}</h3>
                        <p className="text-sm text-slate-600 mb-2">SKU: {item.sku}</p>

                        {item.numColors && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                              🎨 {item.numColors} Colors
                            </span>
                            {item.palette && (
                              <span className="inline-flex items-center text-xs bg-secondary-100 text-secondary-700 px-2 py-1 rounded-full font-medium">
                                {item.palette}
                              </span>
                            )}
                          </div>
                        )}

                        {/* What's Included */}
                        {item.includes && item.includes.length > 0 && (
                          <details className="text-sm text-slate-600">
                            <summary className="cursor-pointer hover:text-primary-600 font-medium mb-1">
                              What's Included ▼
                            </summary>
                            <ul className="space-y-1 pl-4 mt-2">
                              {item.includes.slice(0, 4).map((feature, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-primary-600 mr-2">✓</span>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>

                      {/* Price & Actions */}
                      <div className="text-right flex flex-col justify-between">
                        <div>
                          <p className="text-2xl font-bold text-primary-600">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-slate-500">
                              ${item.price.toFixed(2)} each
                            </p>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="w-8 h-8 p-0"
                          >
                            −
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="w-8 h-8 p-0"
                          >
                            +
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 mt-2"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Trust Signals */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl mb-2">🚚</div>
                  <p className="text-sm font-medium text-slate-900">Free Shipping</p>
                  <p className="text-xs text-slate-500">On all orders</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl mb-2">💝</div>
                  <p className="text-sm font-medium text-slate-900">30-Day Returns</p>
                  <p className="text-xs text-slate-500">Money back guarantee</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl mb-2">🔒</div>
                  <p className="text-sm font-medium text-slate-900">Secure Checkout</p>
                  <p className="text-xs text-slate-500">Powered by Stripe</p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="text-2xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-base">
                      <span className="text-slate-600">Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                      <span className="font-medium text-slate-900">${subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-base">
                      <span className="text-slate-600">Shipping</span>
                      <span className="font-medium text-green-600">FREE</span>
                    </div>

                    <div className="flex justify-between text-base">
                      <span className="text-slate-600">Tax (estimated)</span>
                      <span className="font-medium text-slate-900">${tax.toFixed(2)}</span>
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

                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1">
                      <span>🔒</span>
                      Secure 256-bit SSL encryption
                    </p>
                    <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1">
                      <span>💳</span>
                      All major credit cards accepted
                    </p>
                  </div>

                  {/* Promo Code */}
                  <div className="pt-4 border-t border-slate-100">
                    <details>
                      <summary className="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700">
                        Have a promo code?
                      </summary>
                      <div className="mt-3 flex gap-2">
                        <Input placeholder="Enter code" className="flex-1" />
                        <Button variant="outline" size="sm">Apply</Button>
                      </div>
                    </details>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4 text-center">
                <Link href="/shop" className="text-sm text-primary-600 hover:underline font-medium">
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
