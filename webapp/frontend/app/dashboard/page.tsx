'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { useTemplates, useDeleteTemplate } from '@/lib/hooks'
import { formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useTemplates({ skip: (page - 1) * 12, limit: 12 })
  const deleteMutation = useDeleteTemplate()

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

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
              <Link href="/create">
                <Button>Create New</Button>
              </Link>
              <Link href="/gallery">
                <Button variant="ghost">Gallery</Button>
              </Link>
              <Button variant="ghost">Settings</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Templates</h1>
            <p className="text-gray-600 mt-1">
              {data?.total || 0} templates created
            </p>
          </div>
          <Link href="/create">
            <Button size="lg">
              <span className="mr-2">+</span> Create New Template
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading templates...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600">Error loading templates: {error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && data?.templates.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No templates yet</h3>
            <p className="mt-1 text-gray-500">
              Get started by creating your first paint-by-numbers template
            </p>
            <Link href="/create">
              <Button className="mt-6">Create Your First Template</Button>
            </Link>
          </div>
        )}

        {/* Templates Grid */}
        {!isLoading && data && data.templates.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.templates.map((template) => (
                <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <Link href={`/templates/${template.id}`}>
                    <div className="aspect-square bg-gray-200 relative cursor-pointer">
                      {template.template_url ? (
                        <img
                          src={template.template_url}
                          alt={template.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-4xl">🎨</span>
                        </div>
                      )}
                      {template.difficulty_level && (
                        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-semibold">
                          {template.difficulty_level}
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="pt-4">
                    <Link href={`/templates/${template.id}`}>
                      <h3 className="font-semibold text-lg mb-1 hover:text-primary-600 cursor-pointer truncate">
                        {template.title}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{template.num_colors} colors</span>
                      {template.quality_score && (
                        <span>⭐ {template.quality_score.toFixed(1)}/100</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(template.created_at)}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2 pb-4">
                    <Link href={`/templates/${template.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center px-4">
                  Page {page} of {data.total_pages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                  disabled={page === data.total_pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
