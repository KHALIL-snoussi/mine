/**
 * API Client for Paint by Numbers Platform
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Template {
  id: number
  user_id?: number | null
  title: string
  description?: string
  palette_name: string
  num_colors: number
  model?: string
  paper_format?: string
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

export interface ProcessingModel {
  id: string
  name: string
  display_name: string
  description: string
  difficulty_level: string
  recommended_for: string[]
  color_range: string
  detail_level: string
  processing_time: string
  preview_icon: string
  style_tags: string[]
}

export interface GenerationStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  template_id?: number
  error?: string
}

export interface Product {
  id: number
  sku: string
  name: string
  display_name: string
  product_type: string
  sell_price: number
  description?: string
  features?: string[]
  specifications?: any
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  image_url?: string
}

export interface KitBundle {
  id: number
  sku: string
  name: string
  display_name: string
  description?: string
  includes_frame: boolean
  frame_type?: string
  includes_paints: boolean
  paint_set_type?: string
  includes_brushes: boolean
  brush_count: number
  includes_canvas: boolean
  total_price: number
  discount_percentage: number
  paper_format: string
  is_popular: boolean
  display_order: number
  is_active: boolean
  image_url?: string
}

export interface InventoryStatus {
  product_id: number
  product_name: string
  quantity_available: number
  in_stock: boolean
}

export interface PaintKit {
  id: string
  name: string
  display_name: string
  description?: string
  palette_name: string
  num_colors: number
  price_usd: number
  sku: string
  target_audience: string
  difficulty_level: string
  best_for?: string[]
  includes?: string[]
  estimated_projects?: number
}

export interface KitRecommendation {
  recommended_kit: PaintKit
  confidence: number
  reasoning: string[]
  all_kits_ranked: Array<{
    kit: PaintKit
    score: number
    reasons: string[]
  }>
  analysis: {
    subject_type: string
    complexity_level: string
    is_portrait: boolean
    is_pet: boolean
    is_landscape: boolean
    colors_detected: number
    is_vibrant: boolean
    is_pastel: boolean
  }
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

  isAuthenticated() {
    return Boolean(this.token)
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
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
      model?: string
      paper_format?: string
      is_public?: boolean
      use_region_emphasis?: boolean
      emphasized_region?: {
        x: number
        y: number
        width: number
        height: number
      }
    } = {}
  ): Promise<Template> {
    const formData = new FormData()
    formData.append('file', file)

    if (options.title) formData.append('title', options.title)
    if (options.description) formData.append('description', options.description)
    if (options.palette_name) formData.append('palette_name', options.palette_name)
    if (options.num_colors) formData.append('num_colors', options.num_colors.toString())
    if (options.model) formData.append('model', options.model)
    if (options.paper_format) formData.append('paper_format', options.paper_format)
    if (options.is_public !== undefined) formData.append('is_public', options.is_public.toString())

    // Region emphasis parameters
    if (options.use_region_emphasis !== undefined) formData.append('use_region_emphasis', options.use_region_emphasis.toString())
    if (options.emphasized_region) {
      formData.append('region_x', options.emphasized_region.x.toString())
      formData.append('region_y', options.emphasized_region.y.toString())
      formData.append('region_width', options.emphasized_region.width.toString())
      formData.append('region_height', options.emphasized_region.height.toString())
    }

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

  async listModels(): Promise<ProcessingModel[]> {
    return this.request('/api/v1/templates/models/list')
  }

  async getModel(modelId: string): Promise<ProcessingModel> {
    return this.request(`/api/v1/templates/models/${modelId}`)
  }

  async getKitRecommendation(file: File): Promise<KitRecommendation> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request<KitRecommendation>('/api/v1/templates/recommend-kit', {
      method: 'POST',
      body: formData,
    })
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

  // Product endpoints
  async listKitBundles(params: {
    include_inactive?: boolean
    format?: string
  } = {}): Promise<KitBundle[]> {
    const queryParams = new URLSearchParams()
    if (params.include_inactive !== undefined) queryParams.append('include_inactive', params.include_inactive.toString())
    if (params.format) queryParams.append('format', params.format)

    return this.request(`/api/v1/products/kits/list?${queryParams.toString()}`)
  }

  async getKitBundle(kitId: number): Promise<KitBundle> {
    return this.request(`/api/v1/products/kits/${kitId}`)
  }

  async getKitBySku(sku: string): Promise<KitBundle> {
    return this.request(`/api/v1/products/kits/by-sku/${sku}`)
  }

  async listProducts(params: {
    product_type?: string
    include_inactive?: boolean
  } = {}): Promise<Product[]> {
    const queryParams = new URLSearchParams()
    if (params.product_type) queryParams.append('product_type', params.product_type)
    if (params.include_inactive !== undefined) queryParams.append('include_inactive', params.include_inactive.toString())

    return this.request(`/api/v1/products/products/list?${queryParams.toString()}`)
  }

  async listFrames(): Promise<Product[]> {
    return this.request('/api/v1/products/products/frames')
  }

  async listPaintSets(): Promise<Product[]> {
    return this.request('/api/v1/products/products/paints')
  }

  async listBrushSets(): Promise<Product[]> {
    return this.request('/api/v1/products/products/brushes')
  }

  async getProduct(productId: number): Promise<Product> {
    return this.request(`/api/v1/products/products/${productId}`)
  }

  async checkInventory(productIds?: number[]): Promise<InventoryStatus[]> {
    const queryParams = new URLSearchParams()
    if (productIds && productIds.length > 0) {
      queryParams.append('product_ids', productIds.join(','))
    }

    return this.request(`/api/v1/products/inventory/check?${queryParams.toString()}`)
  }

  async recommendBundle(params: {
    template_format?: string
    difficulty_level?: string
  } = {}): Promise<{
    recommended_kit: KitBundle
    reason: string
    alternatives: Array<{ sku: string; reason: string }>
  }> {
    const queryParams = new URLSearchParams()
    if (params.template_format) queryParams.append('template_format', params.template_format)
    if (params.difficulty_level) queryParams.append('difficulty_level', params.difficulty_level)

    return this.request(`/api/v1/products/recommendations/bundle?${queryParams.toString()}`)
  }
}

export const apiClient = new APIClient()
