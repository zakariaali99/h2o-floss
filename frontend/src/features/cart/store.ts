import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductCard } from '../../api/types'

export interface CartLine {
  product: ProductCard
  quantity: number
}

interface CartState {
  items: CartLine[]
  addItem: (product: ProductCard, quantity?: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  itemCount: () => number
  subtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.product.id === product.id)
          if (existingIndex > -1) {
            const updated = [...state.items]
            const newQty = Math.min(10, updated[existingIndex].quantity + quantity)
            updated[existingIndex] = { ...updated[existingIndex], quantity: newQty }
            return { items: updated }
          }
          return { items: [...state.items, { product, quantity: Math.min(10, quantity) }] }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity: Math.min(10, quantity) } : item,
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      subtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = parseFloat(item.product.price) || 0
          return sum + price * item.quantity
        }, 0)
      },
    }),
    {
      name: 'h2o-cart-storage',
    },
  ),
)
