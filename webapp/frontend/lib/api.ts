/**
 * API Client for Paint by Numbers Platform
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Template {
  id: number
  user_id: number
  title: string
  description?: string
  palette_name: string
  num_colors: number
  difficulty_level?: string
  difficulty_score?: number
  quality_score?: number
  estimated_time?: string

  // URLs
  original_image_url?: string
  template_url?: string
  legend_url?: string
  solution_url?: string
  guide_url?: string
  comparison_url?: string
  svg_template_url?: string
  svg_legend_url?: string
  pdf_url?: string

  // Analysis
  difficulty_analysis?: any
  quality_analysis?: any
  color_mixing_guide?: any

  // Stats
  is_public: boolean
  is_featured: boolean
  views: number
  likes: number
  downloads: number

  created_at: string
  updated_at?: string
}

export interface Palette {
  name: string
  display_name: string
  num_colors: number
  colors: number[][]
  color_names: string[]
  description: string
}

export interface DifficultyPreset {
  name: string
  display_name: string
  num_colors: number
  min_region_size: number
  description: string
}

export interface GenerationStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  template_id?: number
  error?: string
}

class APIClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Template endpoints
  async generateTemplate(
    file: File,
    options: {
      title?: string
      description?: string
      palette_name?: string
      num_colors?: number
      is_public?: boolean
    } = {}
  ): Promise<Template> {
    const formData = new FormData()
    formData.append('file', file)

    if (options.title) formData.append('title', options.title)
    if (options.description) formData.append('description', options.description)
    if (options.palette_name) formData.append('palette_name', options.palette_name)
    if (options.num_colors) formData.append('num_colors', options.num_colors.toString())
    if (options.is_public !== undefined) formData.append('is_public', options.is_public.toString())

    return this.request<Template>('/api/v1/templates/generate', {
      method: 'POST',
      body: formData,
    })
  }

  async listTemplates(params: {
    skip?: number
    limit?: number
    is_public?: boolean
    is_featured?: boolean
  } = {}): Promise<{
    templates: Template[]
    total: number
    page: number
    per_page: number
    total_pages: number
  }> {
    const queryParams = new URLSearchParams()
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())
    if (params.is_public !== undefined) queryParams.append('is_public', params.is_public.toString())
    if (params.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString())

    return this.request(`/api/v1/templates/?${queryParams.toString()}`)
  }

  async getTemplate(id: number): Promise<Template> {
    return this.request(`/api/v1/templates/${id}`)
  }

  async deleteTemplate(id: number): Promise<{ message: string }> {
    return this.request(`/api/v1/templates/${id}`, {
      method: 'DELETE',
    })
  }

  async listPalettes(): Promise<Palette[]> {
    return this.request('/api/v1/templates/palettes/list')
  }

  async listPresets(): Promise<DifficultyPreset[]> {
    return this.request('/api/v1/templates/presets/list')
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)

    const response = await this.request<{ access_token: string; token_type: string }>(
      '/api/v1/auth/login',
      {
        method: 'POST',
        body: formData,
      }
    )

    this.setToken(response.access_token)
    return response
  }

  async register(email: string, password: string, full_name?: string): Promise<any> {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    })
  }

  async getCurrentUser(): Promise<any> {
    return this.request('/api/v1/users/me')
  }

  async logout() {
    this.clearToken()
  }
}

export const apiClient = new APIClient()
