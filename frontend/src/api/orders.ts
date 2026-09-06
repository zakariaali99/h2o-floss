import { api } from './client'
import { config } from '../config'
import { tokenStore } from './token'
import type {
  AdminProductData,
  CheckoutPayload,
  ContactPayload,
  CustomerData,
  OrderData,
  StoreSettingsData,
} from './types'

export const ordersApi = {
  /** Submit guest checkout */
  submitCheckout: async (payload: CheckoutPayload): Promise<OrderData> => {
    return api.post<OrderData>('/checkout/', payload)
  },

  /** Lookup guest order by order number and/or phone number */
  lookupOrder: async (number?: string, phone?: string): Promise<OrderData> => {
    const params = new URLSearchParams()
    if (number) params.set('number', number)
    if (phone) params.set('phone', phone)
    return api.get<OrderData>(`/orders/lookup/?${params.toString()}`)
  },

  /** Submit contact form message */
  submitContact: async (payload: ContactPayload): Promise<{ detail: string }> => {
    return api.post<{ detail: string }>('/contact/', payload)
  },

  /** Live Admin: fetch all orders with status/search filter */
  getAdminOrders: async (params?: { status?: string; search?: string }): Promise<OrderData[]> => {
    const query = new URLSearchParams()
    if (params?.status && params.status !== 'ALL') query.set('status', params.status)
    if (params?.search) query.set('search', params.search)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return api.get<OrderData[]>(`/admin/orders/${qs}`)
  },

  /** Live Admin: number of new (unseen) orders */
  getNewOrdersCount: async (): Promise<number> => {
    const res = await api.get<{ count: number }>('/admin/orders/new-count/')
    return res.count
  },

  /** Live Admin: mark one order as seen (no longer new) */
  markOrderSeen: async (number: string): Promise<OrderData> => {
    return api.post<OrderData>(`/admin/orders/${encodeURIComponent(number)}/seen/`, {})
  },

  /** Live Admin: fetch the order's invoice PDF (auth) and return an object URL to open. */
  fetchInvoiceObjectUrl: async (number: string): Promise<string> => {
    const access = tokenStore.getAccess()
    const res = await fetch(
      `${config.apiBase}/admin/orders/${encodeURIComponent(number)}/invoice.pdf`,
      { headers: access ? { Authorization: `Bearer ${access}` } : {} },
    )
    if (!res.ok) throw new Error(`فشل تحميل الفاتورة (${res.status})`)
    return URL.createObjectURL(await res.blob())
  },

  /** Live Admin: mark every unseen order as seen */
  markAllOrdersSeen: async (): Promise<{ updated: number }> => {
    return api.post<{ updated: number }>('/admin/orders/seen-all/', {})
  },

  /** Live Admin: transition order status */
  updateOrderStatus: async (number: string, status: string): Promise<OrderData> => {
    return api.patch<OrderData>(`/admin/orders/${encodeURIComponent(number)}/status/`, { status })
  },

  /** Live Admin: save order note */
  updateOrderNote: async (number: string, note: string): Promise<OrderData> => {
    return api.post<OrderData>(`/admin/orders/${encodeURIComponent(number)}/note/`, { note })
  },

  /** Public: storefront-safe settings (support WhatsApp number only). */
  getStoreSettings: async (): Promise<{ store_whatsapp: string }> => {
    return api.get<{ store_whatsapp: string }>('/store/settings/')
  },

  /** Admin: full store settings (bank, Telegram, gateway) — requires auth. */
  getAdminSettings: async (): Promise<StoreSettingsData> => {
    return api.get<StoreSettingsData>('/admin/settings/')
  },

  updateStoreSettings: async (data: Partial<StoreSettingsData>): Promise<StoreSettingsData> => {
    return api.patch<StoreSettingsData>('/admin/settings/', data)
  },

  /** Live Admin: Customers CRM */
  getAdminCustomers: async (params?: { search?: string }): Promise<CustomerData[]> => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return api.get<CustomerData[]>(`/admin/customers/${qs}`)
  },

  /** Live Admin: Products Management */
  getAdminProducts: async (): Promise<{ count: number; results: AdminProductData[] }> => {
    return api.get<{ count: number; results: AdminProductData[] }>('/admin/products/')
  },

  createAdminProduct: async (data: Partial<AdminProductData>): Promise<AdminProductData> => {
    return api.post<AdminProductData>('/admin/products/', data)
  },

  updateAdminProduct: async (id: number, data: Partial<AdminProductData>): Promise<AdminProductData> => {
    return api.patch<AdminProductData>(`/admin/products/${id}/`, data)
  },

  deleteAdminProduct: async (id: number): Promise<void> => {
    return api.delete<void>(`/admin/products/${id}/`)
  },
}

