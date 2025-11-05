'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface Order {
  orderId: string
  customer: {
    email: string
    name: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  payment: {
    total: number
    last4: string
  }
  date: string
}

export default function SuccessPage() {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [confettiShown, setConfettiShown] = useState(false)

  useEffect(() => {
    // Load order from session
    const lastOrder = sessionStorage.getItem('last_order')
    if (!lastOrder) {
      router.push('/')
      return
    }

    const orderData = JSON.parse(lastOrder)
    setOrder(orderData)

    // Show confetti animation (optional)
    if (!confettiShown) {
      setConfettiShown(true)
      // You can add a confetti library here
    }
  }, [router, confettiShown])

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-slate-900">
              🎨 Paint by Numbers AI
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <div className="text-5xl animate-bounce">✓</div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Order Confirmed!
          </h1>

          <p className="text-xl text-slate-600 mb-2">
            Thank you for your purchase, {order.customer.name}!
          </p>

          <p className="text-lg text-slate-500">
            We've sent a confirmation email to <strong>{order.customer.email}</strong>
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Order #{order.orderId}</h2>
                <p className="text-sm text-slate-500">
                  Placed on {new Date(order.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">
                  ${order.payment.total.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Items Ordered */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-semibold text-lg mb-4">Items Ordered:</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🎨</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-slate-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="border-t border-slate-200 pt-6 mt-6">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>💳</span>
                <span>Payment Method: Card ending in {order.payment.last4}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-8 bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">🎉 What's Next?</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Check Your Email</p>
                  <p className="text-sm text-slate-600">Order confirmation with tracking info will arrive in 5 minutes</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-900">We'll Ship Your Kit</p>
                  <p className="text-sm text-slate-600">Your paint kit will ship within 1-2 business days</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Start Creating Templates!</p>
                  <p className="text-sm text-slate-600">You can generate unlimited custom templates right now</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/create">
            <Button size="lg" className="w-full sm:w-auto">
              🎨 Create Your First Template
            </Button>
          </Link>
          <Link href="/shop">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Support */}
        <div className="text-center mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-600 mb-2">Need help with your order?</p>
          <p className="text-sm">
            <a href="mailto:support@paintbynumbers.com" className="text-primary-600 hover:underline font-medium">
              Contact Support
            </a>
            {' or '}
            <Link href="/faq" className="text-primary-600 hover:underline font-medium">
              View FAQ
            </Link>
          </p>
        </div>

        {/* Testimonial/Social Proof */}
        <Card className="mt-12 bg-slate-50 border-slate-200">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-slate-600 mb-2">⭐⭐⭐⭐⭐</p>
            <p className="text-slate-700 italic mb-2">
              "Best paint-by-numbers kit I've ever used! The AI templates are amazing and the paint quality is top-notch."
            </p>
            <p className="text-sm text-slate-500">- Sarah M., Verified Buyer</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
