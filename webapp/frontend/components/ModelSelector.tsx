'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import type { ProcessingModel } from '@/lib/api'

interface ModelSelectorProps {
  models?: ProcessingModel[]
  selectedModel: string
  onSelectModel: (modelId: string) => void
  isLoading?: boolean
}

export default function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  isLoading = false
}: ModelSelectorProps) {
  const [showComparison, setShowComparison] = useState(false)

  if (isLoading || !models) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading AI models...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedModelData = models.find(m => m.id === selectedModel)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Choose AI Processing Model</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
            >
              {showComparison ? 'Hide' : 'Compare'} Models
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Each model creates a different style and complexity level. Choose based on your skill and preference.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedModel === model.id
                    ? 'border-primary-600 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-primary-300 hover:shadow-sm'
                }`}
              >
                {/* Popular Badge */}
                {model.id === 'classic' && (
                  <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    Popular
                  </div>
                )}

                {/* Icon */}
                <div className="text-3xl mb-2">{model.preview_icon}</div>

                {/* Name */}
                <h3 className="font-semibold text-lg mb-1">{model.display_name}</h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {model.description}
                </p>

                {/* Stats */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Colors:</span>
                    <span className="font-medium">{model.color_range}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Detail:</span>
                    <span className="font-medium">{model.detail_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time:</span>
                    <span className="font-medium">{model.processing_time}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {model.style_tags.slice(0, 2).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Selected Indicator */}
                {selectedModel === model.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Model Details */}
      {selectedModelData && (
        <Card className="bg-gradient-to-br from-primary-50 to-secondary-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{selectedModelData.preview_icon}</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">
                  Selected: {selectedModelData.display_name}
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  {selectedModelData.description}
                </p>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    💡 Best for:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {selectedModelData.recommended_for.slice(0, 3).map((use, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-primary-600 mr-1">•</span>
                        {use}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      {showComparison && (
        <Card>
          <CardHeader>
            <CardTitle>Model Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Model</th>
                    <th className="text-left py-2 px-3">Difficulty</th>
                    <th className="text-left py-2 px-3">Colors</th>
                    <th className="text-left py-2 px-3">Detail</th>
                    <th className="text-left py-2 px-3">Time</th>
                    <th className="text-left py-2 px-3">Best For</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr
                      key={model.id}
                      className={`border-b hover:bg-gray-50 cursor-pointer ${
                        selectedModel === model.id ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => onSelectModel(model.id)}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span>{model.preview_icon}</span>
                          <span className="font-medium">{model.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize text-xs px-2 py-1 bg-gray-100 rounded">
                          {model.difficulty_level}
                        </span>
                      </td>
                      <td className="py-3 px-3">{model.color_range}</td>
                      <td className="py-3 px-3">{model.detail_level}</td>
                      <td className="py-3 px-3">{model.processing_time}</td>
                      <td className="py-3 px-3 text-xs text-gray-600">
                        {model.recommended_for[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            🤔 Not sure which model to choose?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>First time?</strong> Start with Classic Standard or Simple & Easy</li>
            <li>• <strong>Complex photo?</strong> Use Detailed Professional for best results</li>
            <li>• <strong>Want artistic style?</strong> Try Artistic Painterly or Vibrant & Bold</li>
            <li>• <strong>Not happy?</strong> Try a different model free before ordering!</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
