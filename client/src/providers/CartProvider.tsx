import { type Pack, RESOURCE_TYPES } from '@/pages/EntryList'
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore
} from 'react'
import { useParams } from 'shared'

const STORAGE_KEY_PREFIX = 'vt-cart-'

type CartType = keyof typeof RESOURCE_TYPES

interface CartContextType {
  cart: Pack[]
  cartCount: number
  addToCart: (item: Pack) => void
  removeFromCart: (itemName: string) => void
  clearCart: () => void
  isInCart: (itemName: string) => boolean
  toggleInCart: (item: Pack) => void
  reorderCart: (newCart: Pack[]) => void
}

const CartContext = createContext<CartContextType | null>(null)

function getStorageKey(type: CartType): string {
  return `${STORAGE_KEY_PREFIX}${type}`
}

// Cache for snapshots to avoid infinite loops with useSyncExternalStore
const snapshotCache: Record<CartType, { raw: string; parsed: Pack[] }> = {
  rp: { raw: '', parsed: [] },
  dp: { raw: '', parsed: [] },
  ct: { raw: '', parsed: [] }
}

function getCartFromStorage(type: CartType): Pack[] {
  try {
    const raw = localStorage.getItem(getStorageKey(type)) || '[]'

    // Return cached parsed value if the raw string hasn't changed
    if (snapshotCache[type].raw === raw) {
      return snapshotCache[type].parsed
    }

    // Parse and cache the new value
    const parsed = JSON.parse(raw) as Pack[]

    snapshotCache[type] = { raw, parsed }

    return parsed
  } catch {
    return snapshotCache[type].parsed
  }
}

function saveCartToStorage(type: CartType, cart: Pack[]): void {
  const raw = JSON.stringify(cart)

  localStorage.setItem(getStorageKey(type), raw)
  // Update cache immediately
  snapshotCache[type] = { raw, parsed: cart }
}

// Simple pub/sub for storage changes
const listeners = new Set<() => void>()

function subscribe(callback: () => void): () => void {
  listeners.add(callback)

  return () => listeners.delete(callback)
}

function notifyListeners(): void {
  listeners.forEach(listener => listener())
}

const emptyCart: Pack[] = []

export function CartProvider({ children }: { children: ReactNode }) {
  const { type } = useParams<{ type: CartType }>()

  const currentType = type || 'rp'

  // Create stable getSnapshot functions
  const getSnapshot = useCallback(
    () => getCartFromStorage(currentType),
    [currentType]
  )

  const getServerSnapshot = useCallback(() => emptyCart, [])

  // Use useSyncExternalStore to subscribe to localStorage changes
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const addToCart = useCallback(
    (item: Pack) => {
      const currentCart = getCartFromStorage(currentType)

      const exists = currentCart.some(i => i.name === item.name)

      if (!exists) {
        const newCart = [...currentCart, item]

        saveCartToStorage(currentType, newCart)
        notifyListeners()
      }
    },
    [currentType]
  )

  const removeFromCart = useCallback(
    (itemName: string) => {
      const currentCart = getCartFromStorage(currentType)

      const newCart = currentCart.filter(i => i.name !== itemName)

      saveCartToStorage(currentType, newCart)
      notifyListeners()
    },
    [currentType]
  )

  const clearCart = useCallback(() => {
    saveCartToStorage(currentType, [])
    notifyListeners()
  }, [currentType])

  const isInCart = useCallback(
    (itemName: string): boolean => {
      const currentCart = getCartFromStorage(currentType)

      return currentCart.some(i => i.name === itemName)
    },
    [currentType]
  )

  const toggleInCart = useCallback(
    (item: Pack) => {
      if (isInCart(item.name)) {
        removeFromCart(item.name)
      } else {
        addToCart(item)
      }
    },
    [isInCart, removeFromCart, addToCart]
  )

  const reorderCart = useCallback(
    (newCart: Pack[]) => {
      saveCartToStorage(currentType, newCart)
      notifyListeners()
    },
    [currentType]
  )

  const cartCount = useMemo(() => cart.length, [cart])

  const value: CartContextType = useMemo(
    () => ({
      cart,
      cartCount,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart,
      toggleInCart,
      reorderCart
    }),
    [
      cart,
      cartCount,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart,
      toggleInCart,
      reorderCart
    ]
  )

  return <CartContext value={value}>{children}</CartContext>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}
