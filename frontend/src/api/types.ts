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
