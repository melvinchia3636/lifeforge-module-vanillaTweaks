import useFilter from '@/hooks/useFilter'
import { type Pack, RESOURCE_TYPES } from '@/pages/EntryList'
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
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

  const handleDownload = async () => {}

  const [loading, onDownload] = usePromiseLoading(handleDownload)

  const cartCount = localCart.length

  return (
    <div className="flex min-h-[50vh] w-[90vw] flex-col sm:w-[70vw] md:w-[50vw] lg:w-[40vw]">
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
          <span className="flex items-baseline gap-2">
            {t('modals.packSelector.title', { type: typeName })}
            {cartCount > 0 && (
              <span className="text-bg-500 text-sm">({cartCount})</span>
            )}
          </span>
        }
        onClose={onClose}
      />

      {cartCount > 0 ? (
        <Scrollbar autoHeight autoHeightMax="60vh" className="mt-2">
          <DndContext
            collisionDetection={closestCenter}
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localCart.map(item => item.name)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2 pr-4">
                {localCart.map(item => (
                  <SortablePackItem
                    key={item.name}
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
