'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useTemplate } from '@/lib/hooks'
import { formatDate } from '@/lib/utils'

export default function TemplatePage({ params }: { params: { id: string } }) {
  const templateId = parseInt(params.id)
  const { data: template, isLoading, error } = useTemplate(templateId)

  const getDifficultyEmoji = (level?: string) => {
    const map: Record<string, string> = {
      'Very Easy': '🟢',
      'Easy': '🟢',
      'Medium': '🟡',
      'Hard': '🟠',
      'Very Hard': '🔴',
      'Expert': '🔴',
    }
    return level ? map[level] || '⚪' : '⚪'
  }

  const getQualityStars = (score?: number) => {
    if (!score) return '☆☆☆☆☆'
    const stars = Math.round(score / 20)
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading template...</p>
        </div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading template</p>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
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
              <Link href="/dashboard">
                <Button variant="ghost">My Templates</Button>
              </Link>
              <Link href="/create">
                <Button>Create New</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{template.title}</h1>
          {template.description && (
            <p className="text-lg text-gray-600">{template.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Created {formatDate(template.created_at)}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {template.template_url ? (
                  <img
                    src={template.template_url}
                    alt="Template"
                    className="w-full rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-4xl">🎨</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparison */}
            {template.comparison_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Before & After</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={template.comparison_url}
                    alt="Comparison"
                    className="w-full rounded-lg shadow-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            {template.legend_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Color Legend</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={template.legend_url}
                    alt="Legend"
                    className="w-full rounded-lg shadow-lg"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Info & Downloads */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Template Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Difficulty</span>
                  <span className="font-semibold">
                    {getDifficultyEmoji(template.difficulty_level)} {template.difficulty_level || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Quality Score</span>
                  <span className="font-semibold">
                    {template.quality_score ? `${template.quality_score.toFixed(0)}/100` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Quality Rating</span>
                  <span>{getQualityStars(template.quality_score)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Number of Colors</span>
                  <span className="font-semibold">{template.num_colors}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Palette</span>
                  <span className="font-semibold">{template.palette_name}</span>
                </div>
                {template.estimated_time && (
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-600">Est. Time</span>
                    <span className="font-semibold">{template.estimated_time}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Views</span>
                  <span className="font-semibold">{template.views}</span>
                </div>
              </CardContent>
            </Card>

            {/* Downloads Card */}
            <Card>
              <CardHeader>
                <CardTitle>Downloads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {template.template_url && (
                  <a href={template.template_url} download>
                    <Button variant="outline" className="w-full justify-start">
                      <span className="mr-2">📄</span> Template (PNG)
                    </Button>
                  </a>
                )}
                {template.legend_url && (
                  <a href={template.legend_url} download>
                    <Button variant="outline" className="w-full justify-start">
                      <span className="mr-2">🎨</span> Color Legend (PNG)
                    </Button>
                  </a>
                )}
                {template.solution_url && (
                  <a href={template.solution_url} download>
                    <Button variant="outline" className="w-full justify-start">
                      <span className="mr-2">✅</span> Solution (PNG)
                    </Button>
                  </a>
                )}
                {template.guide_url && (
                  <a href={template.guide_url} download>
                    <Button variant="outline" className="w-full justify-start">
                      <span className="mr-2">📖</span> Painting Guide (PNG)
                    </Button>
                  </a>
                )}
                {template.svg_template_url && (
                  <a href={template.svg_template_url} download>
                    <Button variant="outline" className="w-full justify-start">
                      <span className="mr-2">⚡</span> Template (SVG)
                    </Button>
                  </a>
                )}
                {template.pdf_url && (
                  <a href={template.pdf_url} download>
                    <Button className="w-full justify-start">
                      <span className="mr-2">📦</span> Complete Kit (PDF)
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Difficulty Analysis */}
            {template.difficulty_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Difficulty Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {template.difficulty_analysis.recommendations?.map(
                    (rec: string, idx: number) => (
                      <p key={idx} className="text-gray-600">
                        • {rec}
                      </p>
                    )
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quality Analysis */}
            {template.quality_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {Object.entries(template.quality_analysis.scores || {}).map(
                    ([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-semibold">{value}/100</span>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
