import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gallery | Paint by Numbers AI',
  description: 'Browse our gallery of paint by numbers templates',
}

export default function GalleryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Template Gallery</h1>
      <p className="text-gray-600 mb-8">
        Coming soon! Browse beautiful paint by numbers templates created by our community.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder for gallery items */}
        <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
          <p className="text-gray-400">Gallery coming soon</p>
        </div>
      </div>
    </div>
  )
}
