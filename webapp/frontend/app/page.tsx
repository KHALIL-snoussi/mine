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
              <Link href="/gallery">
                <Button variant="ghost">Gallery</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost">Pricing</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Log In</Button>
              </Link>
              <Link href="/signup">
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
              Upload your photo, preview it instantly, and order your personalized painting kit.
              No experience needed - perfect for relaxation, gifts, or creating lasting memories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Link href="/create">
                <Button size="lg" className="text-lg px-8 py-4">
                  🎨 Create & Preview Free
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                  View Examples
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Free preview • No account needed • Kits from $19.99
            </p>
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

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Perfect Format
            </h2>
            <p className="text-xl text-gray-600">
              From digital downloads to premium painted canvas kits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Digital PDF */}
            <div className="p-8 rounded-lg border-2 border-gray-200 hover:border-primary-500 transition-colors">
              <h3 className="text-2xl font-bold mb-2">Digital PDF</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">$19.99</span>
              </div>
              <p className="text-gray-600 mb-6">Perfect for DIY enthusiasts</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  High-resolution PDF kit
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  Print on any size
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  Color legend & guide
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  Instant download
                </li>
              </ul>
              <Link href="/create">
                <Button variant="outline" className="w-full">
                  Create Now
                </Button>
              </Link>
            </div>

            {/* Printed Canvas Kit */}
            <div className="p-8 rounded-lg border-2 border-primary-600 relative hover:shadow-xl transition-shadow">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Canvas Kit</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">$49.99</span>
              </div>
              <p className="text-gray-600 mb-6">Everything you need to paint</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  Pre-printed canvas (16x20")
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  Complete paint set
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  3 professional brushes
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  Free shipping
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  Color legend included
                </li>
              </ul>
              <Link href="/create">
                <Button className="w-full">
                  Order Kit
                </Button>
              </Link>
            </div>

            {/* Premium Kit */}
            <div className="p-8 rounded-lg border-2 border-gray-200 hover:border-primary-500 transition-colors">
              <h3 className="text-2xl font-bold mb-2">Premium Kit</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">$89.99</span>
              </div>
              <p className="text-gray-600 mb-6">Gift-ready deluxe package</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  Large canvas (24x30")
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  Premium paint set
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  5 artist-grade brushes
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  Wooden display frame
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  Express shipping
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  Gift box packaging
                </li>
              </ul>
              <Link href="/create">
                <Button variant="secondary" className="w-full">
                  Order Premium
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-center mt-8 text-gray-600">
            🎁 Perfect for gifts • 💝 30-day satisfaction guarantee • 🚚 Fast delivery
          </p>
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
