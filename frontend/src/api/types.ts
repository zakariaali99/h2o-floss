export interface HealthResponse {
  status: 'ok'
  service: string
  debug: boolean
  time: string
}

export interface CityOption {
  code: string
  name: string
}

export interface StoreConfig {
  currency: string
  free_shipping: boolean
  shipping_flat_rate: string
  whatsapp_enabled: boolean
  cities: CityOption[]
}

export type ProductKind = 'DEVICE' | 'PART' | 'ACCESSORY' | 'KIT'

export interface CategoryBrief {
  slug: string
  name: string
}

export interface Category {
  id: number
  name: string
  slug: string
  image: string | null
  order: number
  is_parts_group: boolean
  product_count: number
}

export interface ProductImage {
  id: number
  image: string
  caption: string
  is_feature: boolean
}

export interface ProductCard {
  id: number
  slug: string
  name: string
  tagline: string
  kind: ProductKind
  badge: string | null
  price: string
  old_price: string | null
  currency: string
  discount_percent: number
  main_image: string | null
  category: CategoryBrief | null
  in_stock: boolean
  is_featured: boolean
  views_count: number
}

export interface ProductDetail extends ProductCard {
  description: string
  specifications: Record<string, string>
  warranty_months: number
  weight_grams: number | null
  images: ProductImage[]
  related_parts: ProductCard[]
  compatible_devices: ProductCard[]
  kit_contents: ProductCard[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface CheckoutItemPayload {
  product_id: number
  quantity: number
}

export interface CheckoutPayload {
  full_name: string
  phone: string
  email?: string
  city: string
  address: string
  note?: string
  payment_method?: 'CASH_ON_DELIVERY' | 'BANK_TRANSFER'
  items?: CheckoutItemPayload[]
}

export interface OrderItemData {
  product_name: string
  unit_price: string
  quantity: number
  line_total: string
}

export interface WhatsAppNotificationLog {
  recipient_type: 'CUSTOMER' | 'STORE' | 'MANAGER'
  recipient_type_display: string
  phone: string
  status: string
  status_display: string
  created_at: string
}

export interface OrderData {
  number: string
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
  status_display: string
  is_seen?: boolean
  payment_method?: 'CASH_ON_DELIVERY' | 'BANK_TRANSFER'
  payment_method_display?: string
  full_name: string
  phone: string
  email?: string
  city?: string
  city_name: string
  address: string
  note?: string
  admin_notes?: string
  subtotal: string
  shipping: string
  total: string
  items: OrderItemData[]
  created_at?: string
  whatsapp_notifications?: WhatsAppNotificationLog[]
}

export interface ContactPayload {
  name: string
  phone: string
  email?: string
  subject?: string
  message: string
}

export interface StoreSettingsData {
  store_whatsapp: string
  manager_phones: string
  whatsapp_auto_send?: boolean
  whatsapp_gateway_url?: string
  whatsapp_gateway_token?: string
  bank_name: string
  bank_account_holder: string
  bank_account_number: string
  bank_iban: string
  telegram_enabled?: boolean
  telegram_bot_token?: string
  telegram_chat_ids?: string
  updated_at?: string
}

export interface CustomerData {
  id: number
  name: string
  full_name?: string
  phone: string
  email: string
  city: string
  city_name: string
  orders_count: number
  total_spent: string
  last_order_date: string | null
  last_order_status: string | null
  last_order_status_display: string | null
  created_at: string
}

export interface AdminProductData {
  id: number
  name: string
  slug: string
  tagline: string
  kind: ProductKind
  badge: string | null
  price: string
  old_price: string | null
  stock_quantity: number | null
  currency: string
  is_active: boolean
  is_featured: boolean
  hero: boolean
  description: string
  specifications: Record<string, string>
  main_image: string | null
  category?: CategoryBrief | null
  category_id?: number | null
  views_count?: number
  created_at?: string
  updated_at?: string
}


