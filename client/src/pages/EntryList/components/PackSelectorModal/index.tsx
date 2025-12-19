import useFilter from '@/hooks/useFilter'
import { type Pack, RESOURCE_TYPES } from '@/pages/EntryList'
import forgeAPI from '@/utils/forgeAPI'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { Icon } from '@iconify/react'
import {
  Button,
  ConfirmationModal,
  EmptyStateScreen,
  ModalHeader,
  Scrollbar,
  useModalStore
} from 'lifeforge-ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AutoSizer } from 'react-virtualized'
import { useParams, usePromiseLoading } from 'shared'

import SortablePackItem from './components/SortablePackItem'

interface PackSelectorModalProps {
  data: {
    cart: Pack[]
    cartCount: number
    removeFromCart: (itemName: string) => void
    clearCart: () => void
    reorderCart: (newCart: Pack[]) => void
  }
  onClose: () => void
}

function PackSelectorModal({ data, onClose }: PackSelectorModalProps) {
  const { t } = useTranslation('apps.vanillaTweaks')

  const { type } = useParams<{ type: keyof typeof RESOURCE_TYPES }>()

  const open = useModalStore(state => state.open)

  const currentType = type || 'rp'

  const {
    filter: { version }
  } = useFilter()

  const { cart: initialCart, removeFromCart, clearCart, reorderCart } = data

  const [localCart, setLocalCart] = useState<Pack[]>(initialCart)

  useEffect(() => {
    setLocalCart(initialCart)
  }, [initialCart])

  const typeName = RESOURCE_TYPES[currentType][0]

  // Colors for incompatibility groups
  const INCOMPATIBILITY_COLORS = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899' // pink-500
  ]

  // Compute incompatibility groups using Union-Find
  const incompatibilityColorMap = useMemo(() => {
    const colorMap: Record<string, string> = {}

    const cartNames = new Set(localCart.map(item => item.name))

    // Find all pairs of incompatible packs in the cart
    const incompatiblePairs: [string, string][] = []

    for (const item of localCart) {
      if (item.incompatible) {
        for (const incompatibleName of item.incompatible) {
          if (cartNames.has(incompatibleName)) {
            incompatiblePairs.push([item.name, incompatibleName])
          }
        }
      }
    }

    if (incompatiblePairs.length === 0) {
      return colorMap
    }

    // Union-Find to group connected incompatible packs
    const parent: Record<string, string> = {}

    const find = (x: string): string => {
      if (!parent[x]) parent[x] = x

      if (parent[x] !== x) {
        parent[x] = find(parent[x])
      }

      return parent[x]
    }

    const union = (x: string, y: string) => {
      const px = find(x)

      const py = find(y)

      if (px !== py) {
        parent[px] = py
      }
    }

    // Union all incompatible pairs
    for (const [a, b] of incompatiblePairs) {
      union(a, b)
    }

    // Group packs by their root
    const groups: Record<string, string[]> = {}

    for (const [a] of incompatiblePairs) {
      const root = find(a)

      if (!groups[root]) groups[root] = []
      if (!groups[root].includes(a)) groups[root].push(a)
    }

    for (const [, b] of incompatiblePairs) {
      const root = find(b)

      if (!groups[root]) groups[root] = []
      if (!groups[root].includes(b)) groups[root].push(b)
    }

    // Assign colors to groups
    let colorIndex = 0

    for (const root of Object.keys(groups)) {
      const color =
        INCOMPATIBILITY_COLORS[colorIndex % INCOMPATIBILITY_COLORS.length]

      for (const packName of groups[root]) {
        colorMap[packName] = color
      }

      colorIndex++
    }

    return colorMap
  }, [localCart])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = localCart.findIndex(item => item.name === active.id)

      const newIndex = localCart.findIndex(item => item.name === over.id)

      const newCart = arrayMove(localCart, oldIndex, newIndex)

      // Update local state immediately for smooth animation
      setLocalCart(newCart)
      // Persist to storage
      reorderCart(newCart)
    }
  }

  const handleRemove = (itemName: string) => {
    setLocalCart(prev => prev.filter(item => item.name !== itemName))
    removeFromCart(itemName)
  }

  const handleClearAll = useCallback(() => {
    open(ConfirmationModal, {
      title: t('modals.packSelector.clearConfirm.title'),
      description: t('modals.packSelector.clearConfirm.description'),
      confirmationButton: 'delete',
      onConfirm: async () => {
        setLocalCart([])
        clearCart()
      }
    })
  }, [open, t, clearCart])

  const handleDownload = async () => {
    // Group packs by their first category (lowercased, with dashes)
    const packsByCategory: Record<string, string[]> = {}

    for (const item of localCart) {
      // Join nested categories with dots, each segment lowercased with dashes
      const categoryKey = item.categoryPath
        .map(segment => segment.toLowerCase().replace(/ /g, '-'))
        .join('.')

      if (!packsByCategory[categoryKey]) {
        packsByCategory[categoryKey] = []
      }

      packsByCategory[categoryKey].push(item.name)
    }

    const response = await forgeAPI.vanillaTweaks.download.mutate({
      version,
      type: currentType,
      packs: packsByCategory
    })

    if (response.link) {
      // Trigger download
      const downloadUrl = `https://vanillatweaks.net${response.link}`

      const link = document.createElement('a')

      link.href = downloadUrl
      link.download = ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const [loading, onDownload] = usePromiseLoading(handleDownload)

  const cartCount = localCart.length

  return (
    <div className="flex min-h-[50vh] min-w-[60vw] flex-col">
      <ModalHeader
        actionButtonProps={
          cartCount > 0
            ? {
                icon: 'tabler:trash',
                onClick: handleClearAll,
                dangerous: true
              }
            : undefined
        }
        icon={RESOURCE_TYPES[currentType][1]}
        namespace="apps.vanillaTweaks"
        title={
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="min-w-0 truncate">
              {t('modals.packSelector.title', { type: typeName })}
            </span>
            {cartCount > 0 && (
              <span className="text-bg-500 text-sm">({cartCount})</span>
            )}
          </span>
        }
        onClose={onClose}
      />

      {cartCount > 0 ? (
        <div className="flex-1">
          <AutoSizer>
            {({ width, height }) => (
              <Scrollbar
                style={{
                  width,
                  height
                }}
              >
                <DndContext
                  collisionDetection={closestCenter}
                  sensors={sensors}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localCart.map(item => item.name)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2">
                      {localCart.map(item => (
                        <SortablePackItem
                          key={item.name}
                          incompatibilityColor={
                            incompatibilityColorMap[item.name]
                          }
                          item={item}
                          type={currentType}
                          version={version}
                          onRemove={handleRemove}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </Scrollbar>
            )}
          </AutoSizer>
        </div>
      ) : (
        <div className="flex-center flex-1 py-12">
          <EmptyStateScreen
            icon="tabler:shopping-cart-off"
            message={{
              id: 'cart',
              namespace: 'apps.vanillaTweaks',
              tKey: 'modals.packSelector'
            }}
          />
        </div>
      )}

      {cartCount > 0 && (
        <p className="text-bg-500 mt-6 text-sm">
          <Icon className="mr-1 inline size-4" icon="tabler:info-circle" />
          {t('modals.packSelector.dragHint')}
        </p>
      )}
      <Button
        className="mt-6"
        disabled={cartCount === 0}
        icon="tabler:download"
        loading={loading}
        onClick={onDownload}
      >
        download
      </Button>
    </div>
  )
}

export default PackSelectorModal
