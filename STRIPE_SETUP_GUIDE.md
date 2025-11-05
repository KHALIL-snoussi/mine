# 💳 Stripe Payment Integration Guide

Complete guide to integrate Stripe payments for production-ready checkout.

---

## 🎯 Current Status

### ✅ What's Working:
- **Checkout page created** - Complete form with validation
- **Order processing** - Order creation and storage
- **Success page** - Beautiful confirmation page
- **Test mode ready** - Works with test card numbers

### ⚠️ What Needs Stripe:
- **Real payment processing** - Currently simulated
- **Webhook handling** - For payment confirmations
- **Backend API** - To securely process payments

---

## 🚀 Quick Setup (Test Mode - 30 Minutes)

### **Step 1: Create Stripe Account**

1. Go to: https://stripe.com
2. Click "Start now" → Sign up
3. Complete verification (business info)
4. You'll get TEST API keys immediately

### **Step 2: Get API Keys**

1. Go to Dashboard → Developers → API Keys
2. Copy these keys:
   - **Publishable key:** `pk_test_...`
   - **Secret key:** `sk_test_...`

### **Step 3: Add to Environment**

Edit `/home/user/mine/webapp/.env`:

```bash
# Stripe (Test Mode)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

### **Step 4: Install Stripe SDK**

```bash
cd /home/user/mine/webapp/frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### **Step 5: Test Payment**

Use test card: **4242 4242 4242 4242**
- Any future expiry date (e.g., 12/25)
- Any 3-digit CVC (e.g., 123)
- Any ZIP code (e.g., 12345)

---

## 💻 Backend Integration (Required for Production)

### **Create Payment Intent Endpoint**

File: `/webapp/backend/app/api/v1/endpoints/payments.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import stripe
import os

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

router = APIRouter()

class CreatePaymentIntentRequest(BaseModel):
    amount: int  # in cents
    currency: str = "usd"
    customer_email: str

@router.post("/create-payment-intent")
async def create_payment_intent(request: CreatePaymentIntentRequest):
    try:
        intent = stripe.PaymentIntent.create(
            amount=request.amount,
            currency=request.currency,
            receipt_email=request.customer_email,
            metadata={
                'integration_check': 'accept_a_payment'
            }
        )

        return {
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/confirm-payment")
async def confirm_payment(payment_intent_id: str):
    """Confirm payment was successful"""
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)

        if intent.status == 'succeeded':
            # Payment successful - create order in database
            # TODO: Add order creation logic here
            return {
                'status': 'success',
                'amount': intent.amount,
                'customer': intent.receipt_email
            }
        else:
            return {
                'status': 'pending',
                'message': 'Payment not yet confirmed'
            }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### **Add to Router**

File: `/webapp/backend/app/api/v1/router.py`

```python
from app.api.v1.endpoints import payments

api_router.include_router(
    payments.router,
    prefix="/payments",
    tags=["payments"]
)
```

---

## 🎨 Frontend Integration (Full Stripe)

### **Update Checkout Page**

Replace the current simple checkout with full Stripe Elements:

File: `/webapp/frontend/app/checkout/page.tsx`

```typescript
'use client'

import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useState } from 'react'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ cart, customerInfo }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError('')

    try {
      // 1. Create Payment Intent on backend
      const response = await fetch('/api/v1/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(cart.total * 100), // Convert to cents
          currency: 'usd',
          customer_email: customerInfo.email
        })
      })

      const { client_secret } = await response.json()

      // 2. Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            address: {
              line1: customerInfo.address,
              city: customerInfo.city,
              state: customerInfo.state,
              postal_code: customerInfo.zip,
              country: 'US'
            }
          }
        }
      })

      if (result.error) {
        setError(result.error.message || 'Payment failed')
      } else if (result.paymentIntent.status === 'succeeded') {
        // 3. Confirm with backend
        await fetch('/api/v1/payments/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_intent_id: result.paymentIntent.id
          })
        })

        // 4. Clear cart and redirect to success
        localStorage.removeItem('cart')
        router.push('/checkout/success')
      }

    } catch (err) {
      setError('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' }
            },
            invalid: { color: '#9e2146' }
          }
        }}
      />

      {error && <div className="text-red-600">{error}</div>}

      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay $${cart.total.toFixed(2)}`}
      </button>
    </form>
  )
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm cart={cart} customerInfo={info} />
    </Elements>
  )
}
```

---

## 🔒 Production Setup

### **Step 1: Activate Live Mode**

1. Complete Stripe account verification
2. Add business details
3. Add bank account for payouts
4. Go to Dashboard → Developers → API Keys
5. Toggle to "View live data"
6. Copy **LIVE** keys (start with `pk_live_` and `sk_live_`)

### **Step 2: Update Environment**

```bash
# Production .env
ENVIRONMENT=production
STRIPE_PUBLISHABLE_KEY=pk_live_your_real_key
STRIPE_SECRET_KEY=sk_live_your_real_secret
```

### **Step 3: Set Up Webhooks**

1. Go to Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/v1/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook secret → Add to `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### **Step 4: Webhook Handler**

File: `/webapp/backend/app/api/v1/endpoints/webhooks.py`

```python
from fastapi import APIRouter, Request, HTTPException
import stripe
import os

router = APIRouter()

@router.post("/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            os.getenv('STRIPE_WEBHOOK_SECRET')
        )

        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            # Handle successful payment
            # TODO: Create order in database, send confirmation email

        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            # Handle failed payment
            # TODO: Notify customer, log failure

        return {'status': 'success'}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

## 🧪 Testing

### **Test Cards (Test Mode Only)**

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |

### **Test Checklist**

- [ ] Successful payment flow works
- [ ] Failed payment shows error message
- [ ] Email confirmation sent
- [ ] Order saved to database
- [ ] Cart cleared after payment
- [ ] Webhook receives events
- [ ] Refunds work (test in dashboard)

---

## 💰 Pricing & Fees

### **Stripe Fees:**
- **Online payments:** 2.9% + $0.30 per successful transaction
- **International cards:** +1% (3.9% + $0.30)
- **Currency conversion:** +1%

### **Example:**
- Sale: $39.99
- Stripe fee: $1.46 (2.9% + $0.30)
- You receive: $38.53

---

## 🔐 Security Checklist

### **Before Going Live:**

- [ ] Never store card numbers (use Stripe tokens)
- [ ] Use HTTPS only (SSL certificate)
- [ ] Validate on backend (never trust frontend)
- [ ] Use webhook secrets (verify signatures)
- [ ] Log all transactions
- [ ] Set up fraud detection (Stripe Radar - free)
- [ ] Comply with PCI-DSS (Stripe handles this)
- [ ] Add rate limiting to payment endpoints
- [ ] Set up monitoring/alerts
- [ ] Test with real cards in test mode first

---

## 📊 Dashboard & Monitoring

### **Stripe Dashboard:**
- View all transactions
- Manage refunds
- See customer disputes
- Download reports
- Track revenue

### **Monitor These Metrics:**
- **Success rate:** Should be >95%
- **Dispute rate:** Should be <0.5%
- **Average transaction value**
- **Failed payments** (fix issues causing failures)

---

## 🚨 Common Issues & Solutions

### **Issue: "No such customer"**
**Solution:** Create customer first:
```python
customer = stripe.Customer.create(email=user.email)
```

### **Issue: "Card declined"**
**Solution:** Show user-friendly error, suggest they:
- Check card details
- Try different card
- Contact their bank

### **Issue: "Webhook signature verification failed"**
**Solution:**
- Verify webhook secret is correct
- Use raw request body (don't parse JSON first)

### **Issue: "Payment succeeded but order not created"**
**Solution:**
- Implement idempotency (check if order already exists)
- Use webhook as source of truth
- Log all webhook events

---

## 📚 Resources

- **Stripe Docs:** https://stripe.com/docs
- **Testing:** https://stripe.com/docs/testing
- **Webhooks:** https://stripe.com/docs/webhooks
- **Dashboard:** https://dashboard.stripe.com
- **Support:** https://support.stripe.com

---

## ✅ Current Implementation (Test Mode)

### **What Works Now:**

✅ **Frontend:**
- Checkout form with validation
- Card number formatting
- Expiry date validation
- CVC validation
- Order summary
- Success page

✅ **Simulated:**
- Payment processing (2 second delay)
- Order creation (localStorage)
- Email confirmation (session storage)

### **To Add for Production:**

⚠️ **Backend:**
1. Install Stripe SDK: `pip install stripe`
2. Create payment endpoints (above)
3. Add webhook handler (above)
4. Integrate with database (save orders)
5. Send real confirmation emails

⚠️ **Frontend:**
1. Install Stripe.js: `npm install @stripe/stripe-js`
2. Replace simple form with Stripe Elements
3. Call backend payment API
4. Handle errors properly

---

## 🎯 Quick Start (This Weekend)

### **For Testing (Works Now):**
1. Use current checkout (already built!)
2. Test with card: 4242 4242 4242 4242
3. Everything works except real payment

### **For Real Payments (Add Monday):**
1. Create Stripe account (15 min)
2. Get test API keys (5 min)
3. Install Stripe SDK backend (5 min)
4. Add payment endpoint (30 min)
5. Test with test cards (15 min)

**Total time: ~70 minutes to go live!**

---

## 💡 Pro Tips

1. **Start in test mode** - Get it working with test cards first
2. **Use webhooks** - They're more reliable than redirect flows
3. **Save customer ID** - Makes future payments easier
4. **Offer subscriptions later** - Stripe handles recurring billing
5. **Enable fraud detection** - Stripe Radar is free and catches fraud
6. **Set up tax** - Stripe Tax can handle sales tax automatically

---

**Questions? Check Stripe docs or ask me!** 💬

---

**Current Status: Ready for test mode! Add 1 hour of work for real payments.** ✅
