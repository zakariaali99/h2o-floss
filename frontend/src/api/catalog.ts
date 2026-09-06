import { api } from './client'
import type { Category, PaginatedResponse, ProductCard, ProductDetail } from './types'

export interface ProductListParams {
  kind?: string
  category?: string
  featured?: boolean
}

export const catalogApi = {
  getCategories: () => api.get<Category[]>('/catalog/categories/'),

  getProducts: (params: ProductListParams = {}) => {
    const query = new URLSearchParams()
    if (params.kind) query.set('kind', params.kind)
    if (params.category) query.set('category', params.category)
    if (params.featured !== undefined) query.set('featured', String(params.featured))
    const qs = query.toString()
    return api.get<PaginatedResponse<ProductCard>>(`/catalog/products/${qs ? `?${qs}` : ''}`)
  },

  getProduct: (slug: string) => api.get<ProductDetail>(`/catalog/products/${slug}/`),

  getProductParts: (slug: string) => api.get<ProductCard[]>(`/catalog/products/${slug}/parts/`),

  recordProductView: (slug: string) => api.post<{ ok: boolean }>(`/catalog/products/${slug}/view/`),
}
