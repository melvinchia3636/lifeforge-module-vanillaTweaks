import useFilter from '@/hooks/useFilter'
import { CartProvider, useCart } from '@/providers/CartProvider'
import forgeAPI from '@/utils/forgeAPI'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  ConfirmationModal,
  ContentWrapperWithSidebar,
  LayoutWithSidebar,
  Listbox,
  ListboxOption,
  ModuleHeader,
  SearchInput,
  VirtualGrid,
  WithQuery,
  useModalStore
} from 'lifeforge-ui'
import _ from 'lodash'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { type InferOutput, useParams } from 'shared'

import type { Category } from '../../../../server/types/resource_pack.types'
import InnerHeader from './components/InnerHeader'
import PackItem from './components/PackItem'
import PackSelectorModal from './components/PackSelectorModal'
import Sidebar from './components/Sidebar'

export type Pack = InferOutput<
  typeof forgeAPI.vanillaTweaks.list
>['categories'][number]['packs'][number] & {
  categoryPath: string[]
}

export const RESOURCE_TYPES = {
  rp: ['Resource Packs', 'tabler:texture'],
  dp: ['Data Packs', 'tabler:database'],
  ct: ['Crafting Tweaks', 'tabler:hammer']
}

const flattenCategories = (
  categories: Category[],
  categoryPath: string[]
): (Pack & {
  categoryPath: string[]
})[] => {
  let packs: (Pack & { categoryPath: string[] })[] = []

  for (const category of categories) {
    packs = packs.concat(
      category.packs.map(pack => ({
        ...pack,
        categoryPath: [...categoryPath, category.category]
      }))
    )

    if (category.categories) {
      packs = packs.concat(
        flattenCategories(category.categories, [
          ...categoryPath,
          category.category
        ])
      )
    }
  }

  return packs
}

function EntryListContent() {
  const { type } = useParams<{ type: keyof typeof RESOURCE_TYPES }>()

  const open = useModalStore(state => state.open)

  const { filter, updateFilter } = useFilter()

  const { cart, cartCount, removeFromCart, clearCart, reorderCart } = useCart()

  const handleOpenPackSelector = useCallback(() => {
    open(PackSelectorModal, {
      cart,
      cartCount,
      removeFromCart,
      clearCart,
      reorderCart
    })
  }, [open, cart, cartCount, removeFromCart, clearCart, reorderCart])

  const { t } = useTranslation('apps.vanillaTweaks')

  const handleVersionChange = useCallback(
    (newVersion: string) => {
      if (cartCount > 0) {
        open(ConfirmationModal, {
          title: t('modals.packSelector.versionChange.title'),
          description: t('modals.packSelector.versionChange.description'),
          confirmationButton: 'confirm',
          onConfirm: async () => {
            updateFilter(() => ({ version: newVersion, category: '', q: '' }))
            clearCart()
          }
        })
      } else {
        updateFilter(() => ({ version: newVersion, category: '', q: '' }))
      }
    },
    [cartCount, open, t, updateFilter, clearCart]
  )

  const entriesQuery = useQuery(
    forgeAPI.vanillaTweaks.list
      .input({
        version: filter.version,
        type: type || 'rp'
      })
      .queryOptions()
  )

  const filteredAndFlattenedEntries = useMemo(() => {
    if (!entriesQuery.data) return []

    return flattenCategories(entriesQuery.data.categories, []).filter(entry => {
      if (entry.experiment) {
        return false
      }

      // Filter by category
      if (filter.category) {
        const filterCategories = filter.category.split(',')

        for (let i = 0; i < filterCategories.length; i++) {
          if (entry.categoryPath[i] !== filterCategories[i]) {
            return false
          }
        }
      }

      if (filter.q) {
        const query = filter.q.toLowerCase()

        if (
          !entry.name.toLowerCase().includes(query) &&
          !entry.description.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      return true
    })
  }, [entriesQuery.data, filter.category, filter.q])

  useEffect(() => {
    updateFilter(() => ({ category: '', q: '', version: '1.21' }))
  }, [type])

  return (
    <>
      <ModuleHeader
        actionButton={
          <Button
            icon="tabler:shopping-bag"
            variant="plain"
            onClick={handleOpenPackSelector}
          >
            {cartCount > 0 && <span className="text-sm">({cartCount})</span>}
          </Button>
        }
        tips={{
          title: 'Disclaimer',
          content: (
            <>
              <p>
                LifeForge is not affiliated with Vanilla Tweaks. The packs
                listed here are fetched from the official Vanilla Tweaks API for
                your convenience.
              </p>
              <p className="mt-2">
                Please support the original creator by visiting the{' '}
                <a
                  className="text-custom-500 underline"
                  href="https://vanillatweaks.net/"
                  rel="noreferrer"
                  target="_blank"
                >
                  Vanilla Tweaks website
                </a>
                .
              </p>
            </>
          )
        }}
      />
      <LayoutWithSidebar>
        <Sidebar entriesQuery={entriesQuery} />
        <ContentWrapperWithSidebar>
          <InnerHeader
            filteredAndFlattenedEntries={filteredAndFlattenedEntries}
          />
          <div className="mt-4 mb-6 flex items-center gap-2">
            {entriesQuery.data && (
              <Listbox
                buttonContent={
                  <div className="flex items-center">
                    <Icon
                      className="mr-2 size-5"
                      icon="tabler:device-gamepad"
                    />
                    {filter.version}
                  </div>
                }
                className="max-w-40"
                value={filter.version}
                onChange={handleVersionChange}
              >
                {Array(
                  entriesQuery.data.versions[1] -
                    entriesQuery.data.versions[0] +
                    1
                )
                  .fill(null)
                  .map((_, index) => {
                    const version = `1.${entriesQuery.data.versions[1] - index}`

                    return (
                      <ListboxOption
                        key={version}
                        icon="tabler:cube"
                        label={version}
                        value={version}
                      />
                    )
                  })}
              </Listbox>
            )}
            <SearchInput
              namespace="apps.vanillaTweaks"
              searchTarget={_.camelCase(RESOURCE_TYPES[type || 'rp'][0])}
              value={filter.q}
              onChange={q => updateFilter(prev => ({ ...prev, q }))}
            />
          </div>
          <div className="flex-1">
            <WithQuery query={entriesQuery}>
              {() => (
                <VirtualGrid
                  gap={12}
                  getItemKey={entry => entry.name}
                  itemMinWidth={240}
                  items={filteredAndFlattenedEntries}
                  renderItem={entry => <PackItem entry={entry} />}
                />
              )}
            </WithQuery>
          </div>
        </ContentWrapperWithSidebar>
      </LayoutWithSidebar>
    </>
  )
}

function EntryList() {
  return (
    <CartProvider>
      <EntryListContent />
    </CartProvider>
  )
}

export default EntryList
