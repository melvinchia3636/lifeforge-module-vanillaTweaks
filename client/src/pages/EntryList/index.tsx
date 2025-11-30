import useFilter from '@/hooks/useFilter'
import forgeAPI from '@/utils/forgeAPI'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import {
  ContentWrapperWithSidebar,
  LayoutWithSidebar,
  Listbox,
  ListboxOption,
  ModuleHeader,
  Scrollbar,
  SearchInput,
  VirtualGrid,
  WithQuery
} from 'lifeforge-ui'
import _ from 'lodash'
import { useEffect, useMemo } from 'react'
import { type InferOutput, useParams } from 'shared'

import type { Category } from '../../../../server/types/resource_pack.types'
import InnerHeader from './components/InnerHeader'
import PackItem from './components/PackItem'
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

function EntryList() {
  const { type } = useParams<{ type: keyof typeof RESOURCE_TYPES }>()

  const { filter, updateFilter } = useFilter()

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
      <ModuleHeader />
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
                onChange={version => {
                  updateFilter(() => ({ version, category: '', q: '' }))
                }}
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
          <Scrollbar>
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
          </Scrollbar>
        </ContentWrapperWithSidebar>
      </LayoutWithSidebar>
    </>
  )
}

export default EntryList
