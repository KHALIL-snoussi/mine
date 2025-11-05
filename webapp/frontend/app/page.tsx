import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">
                🎨 Paint by Numbers AI
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/shop">
                <Button variant="ghost">Shop Kits</Button>
              </Link>
              <Link href="/create">
                <Button variant="ghost">Try Free</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Log In</Button>
              </Link>
              <Link href="/shop">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 animate-fade-in">
              Turn Your Photos into
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                Custom Paint by Numbers Kits
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto animate-slide-up">
              Buy ONE paint kit, paint UNLIMITED templates! Our smart color system means your paints work for every image.
              No experience needed - perfect for relaxation, gifts, or creating lasting memories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Link href="/create">
                <Button size="lg" className="text-lg px-8 py-4">
                  🎨 Create & Preview Free
                </Button>
              </Link>
              <Link href="/shop">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                  Shop Paint Kits
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Free preview • No account needed • Paint Kits from $24.99
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">10,000+</div>
              <p className="text-sm text-gray-600">Happy Customers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">50,000+</div>
              <p className="text-sm text-gray-600">Templates Created</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">4.9★</div>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">30-Day</div>
              <p className="text-sm text-gray-600">Money-Back Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Our System Works Better
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stop wasting money on custom paints for every single image!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Old Way */}
            <div className="bg-white p-8 rounded-2xl border-2 border-red-200 relative">
              <div className="absolute -top-4 left-6 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                ❌ The Old Way
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 mt-2">Random Colors Every Time</h3>
              <ul className="space-y-3">
                <li className="flex items-start text-gray-600">
                  <span className="text-red-500 mr-2 mt-1">✗</span>
                  <span>Need 23 custom colors for THIS image</span>
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="text-red-500 mr-2 mt-1">✗</span>
                  <span>Buy completely different paints for NEXT image</span>
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="text-red-500 mr-2 mt-1">✗</span>
                  <span>Leftover paints are useless</span>
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="text-red-500 mr-2 mt-1">✗</span>
                  <span>Expensive and wasteful</span>
                </li>
                <li className="flex items-start text-gray-600">
                  <span className="text-red-500 mr-2 mt-1">✗</span>
                  <span>Can't build a collection</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-red-50 rounded-lg">
                <p className="text-sm font-semibold text-red-800">Cost: $40-60 per template 💸</p>
              </div>
            </div>

            {/* New Way */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-8 rounded-2xl border-2 border-primary-500 relative shadow-xl">
              <div className="absolute -top-4 left-6 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                ✓ Our Smart System
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 mt-2">Fixed Color Palettes</h3>
              <ul className="space-y-3">
                <li className="flex items-start text-gray-700">
                  <span className="text-primary-600 mr-2 mt-1">✓</span>
                  <span className="font-medium">Buy ONE paint kit (12-24 colors)</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <span className="text-primary-600 mr-2 mt-1">✓</span>
                  <span className="font-medium">Generate UNLIMITED templates</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <span className="text-primary-600 mr-2 mt-1">✓</span>
                  <span className="font-medium">Same paints work for everything</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <span className="text-primary-600 mr-2 mt-1">✓</span>
                  <span className="font-medium">AI adapts images to your kit</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <span className="text-primary-600 mr-2 mt-1">✓</span>
                  <span className="font-medium">Build your collection!</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-primary-600 text-white rounded-lg">
                <p className="text-sm font-semibold">Cost: $25-60 ONE TIME for unlimited templates! 🎉</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-2xl shadow-lg">
              <p className="text-lg font-bold mb-1">💰 Save $1000+ per year!</p>
              <p className="text-sm opacity-90">Average customer paints 20+ templates with one kit</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Intelligent Features
            </h2>
            <p className="text-xl text-gray-600">
              Powered by advanced AI to create the perfect paint-by-numbers experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Unified Color Palettes</h3>
              <p className="text-gray-600">
                Choose from 7 professional palettes. Same colors across all templates means one paint set works for everything!
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Theme Detection</h3>
              <p className="text-gray-600">
                AI analyzes your image and automatically recommends the perfect palette based on colors, mood, and theme.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Difficulty Analysis</h3>
              <p className="text-gray-600">
                Get instant ratings from Easy to Expert with estimated completion times and personalized tips.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Scoring</h3>
              <p className="text-gray-600">
                Advanced metrics evaluate color accuracy, region quality, and paintability with actionable feedback.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🖼️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple Formats</h3>
              <p className="text-gray-600">
                Download as PNG, scalable SVG, or complete PDF kits with legends, guides, and solutions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Color Mixing Guides</h3>
              <p className="text-gray-600">
                Get professional mixing recipes to create any color from a base set of primary paints.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Create professional templates in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Image</h3>
              <p className="text-gray-600">
                Choose any photo - portraits, landscapes, pets, anything you love
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Does the Magic</h3>
              <p className="text-gray-600">
                Our intelligence system analyzes, optimizes, and creates your perfect template
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Download & Paint</h3>
              <p className="text-gray-600">
                Get your complete kit with template, legend, guide, and start painting!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Paint Kit Showcase Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Buy Once, Paint Forever! 🎨
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Choose your paint kit once, then generate unlimited templates that work with the SAME colors.
              No more buying custom paints for each project!
            </p>
            <Link href="/shop">
              <Button size="lg" variant="outline">
                View All 6 Paint Kits
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Kit */}
            <div className="group p-8 rounded-3xl bg-white border-2 border-gray-200 hover:border-primary-400 hover:shadow-2xl transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Starter Kit</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-primary-600">$24.99</span>
                </div>
                <p className="text-gray-600">Perfect for beginners & kids</p>
              </div>

              <div className="mb-6">
                <div className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  12 Colors
                </div>
                <p className="text-sm text-gray-600 mb-4">Paint 3+ beautiful templates</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm">12 premium acrylic paints</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm">3 quality brushes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm">Color reference card</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm">Bonus digital templates</span>
                </li>
              </ul>

              <Link href="/shop">
                <Button variant="outline" className="w-full group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Creative Kit - MOST POPULAR */}
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-500 relative hover:shadow-2xl transition-all duration-300 scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                ⭐ Most Popular
              </div>

              <div className="mb-6 mt-2">
                <h3 className="text-2xl font-bold mb-2">Creative Kit</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-primary-600">$39.99</span>
                </div>
                <p className="text-gray-700 font-medium">For hobbyists & enthusiasts</p>
              </div>

              <div className="mb-6">
                <div className="inline-block bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  18 Colors
                </div>
                <p className="text-sm text-gray-700 mb-4">Paint 5+ detailed templates</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm font-medium">18 premium acrylic paints</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm font-medium">5 professional brushes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm font-medium">Color mixing guide</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm font-medium">Palette tray included</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm font-medium">10 template credits</span>
                </li>
              </ul>

              <Link href="/shop">
                <Button className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Professional Kit */}
            <div className="group p-8 rounded-3xl bg-white border-2 border-gray-200 hover:border-primary-400 hover:shadow-2xl transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Professional Kit</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-primary-600">$59.99</span>
                </div>
                <p className="text-gray-600">For serious artists</p>
              </div>

              <div className="mb-6">
                <div className="inline-block bg-secondary-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  24 Colors
                </div>
                <p className="text-sm text-gray-600 mb-4">Paint 10+ complex templates</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm">24 professional-grade paints (50ml)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm">8 premium brushes (complete range)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm">Advanced mixing guide</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm">Paint storage organizer</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-sm">1 year unlimited templates</span>
                </li>
              </ul>

              <Link href="/shop">
                <Button variant="secondary" className="w-full group-hover:bg-secondary-600 group-hover:text-white transition-colors">
                  Go Professional
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">
              🎁 30-day money-back guarantee • 🚚 Free shipping on orders over $50 • 💝 Perfect for gifts
            </p>
            <div className="inline-block bg-gradient-to-r from-primary-100 to-secondary-100 px-8 py-4 rounded-2xl">
              <p className="text-sm font-semibold text-gray-800 mb-1">💰 Save Even More with Subscriptions!</p>
              <p className="text-sm text-gray-600">Get monthly templates + paint refills from <span className="font-bold text-primary-600">$29.99/month</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Create Your First Template?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of artists creating beautiful paint-by-numbers templates
          </p>
          <Link href="/create">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4">
              Start Creating Now
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our paint kits and templates
            </p>
          </div>

          <div className="space-y-6">
            {/* FAQ Item */}
            <details className="group bg-gray-50 rounded-xl p-6 cursor-pointer">
              <summary className="flex justify-between items-center font-semibold text-lg text-gray-900 list-none">
                <span>🎨 Do I really get unlimited templates with one kit?</span>
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 text-gray-600">
                <strong>Yes! 100% unlimited.</strong> When you buy a paint kit (e.g., Creative Kit with 18 colors), you can generate and download as many PDF templates as you want, forever. The templates are free - you're just paying for the physical paints once. The paint itself lasts for approximately 3-5 large canvas projects depending on kit size.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-6 cursor-pointer">
              <summary className="flex justify-between items-center font-semibold text-lg text-gray-900 list-none">
                <span>💰 What exactly am I paying for?</span>
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 text-gray-600">
                You're paying <strong>once</strong> for the physical paint kit (paints, brushes, mixing tray, guides). This includes <strong>lifetime access</strong> to our template generation system. Upload any photo, generate a custom template that uses your kit's colors, download the PDF for free, and paint it!
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-6 cursor-pointer">
              <summary className="flex justify-between items-center font-semibold text-lg text-gray-900 list-none">
                <span>🚚 How long does shipping take?</span>
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 text-gray-600">
                Physical paint kits ship within 24 hours and typically arrive in 3-5 business days in the US. <strong>Free shipping on orders over $50!</strong> Once you receive your kit, you can start generating and downloading templates immediately.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-6 cursor-pointer">
              <summary className="flex justify-between items-center font-semibold text-lg text-gray-900 list-none">
                <span>🎯 Can I try before I buy?</span>
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 text-gray-600">
                <strong>Absolutely!</strong> You can upload a photo and see a free preview of how it will look as a paint-by-numbers template. Our AI will even recommend which kit works best for your image. No credit card required for the preview.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-6 cursor-pointer">
              <summary className="flex justify-between items-center font-semibold text-lg text-gray-900 list-none">
                <span>🔄 What if I'm not satisfied?</span>
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 text-gray-600">
                We offer a <strong>30-day money-back guarantee</strong> on all paint kits. If you're not completely satisfied, return it for a full refund - no questions asked!
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-6 cursor-pointer">
              <summary className="flex justify-between items-center font-semibold text-lg text-gray-900 list-none">
                <span>🖌️ Which kit should I choose?</span>
                <span className="transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 text-gray-600">
                <strong>Starter Kit ($24.99):</strong> 12 colors, perfect for beginners and simple projects.<br />
                <strong>Creative Kit ($39.99):</strong> 18 colors, our most popular choice for detailed portraits and landscapes.<br />
                <strong>Professional Kit ($59.99):</strong> 24 colors, for advanced painters who want maximum detail and color range.<br />
                Try our free preview tool - our AI will recommend the best kit for your specific image!
              </p>
            </details>
          </div>

          <div className="mt-12 text-center p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl">
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Still have questions?
            </p>
            <p className="text-gray-600 mb-4">
              We're here to help! Email us at <a href="mailto:support@paintbynumbersai.com" className="text-primary-600 font-semibold hover:underline">support@paintbynumbersai.com</a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Paint by Numbers AI</h3>
              <p className="text-sm">
                Transform your photos into beautiful paint-by-numbers templates with AI.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/shop" className="hover:text-white">Paint Kits</Link></li>
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/gallery" className="hover:text-white">Gallery</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; 2025 Paint by Numbers AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
