import useFilter from '@/hooks/useFilter'
import { Icon } from '@iconify/react'
import { Button, TagsFilter, useModuleSidebarState } from 'lifeforge-ui'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import { useParams } from 'shared'

import { type Pack, RESOURCE_TYPES } from '..'

function InnerHeader({
  filteredAndFlattenedEntries
}: {
  filteredAndFlattenedEntries: Pack[]
}) {
  const { t } = useTranslation('apps.vanillaTweaks')

  const { type } = useParams<{ type: keyof typeof RESOURCE_TYPES }>()

  const { filter, updateFilter } = useFilter()

  const { setIsSidebarOpen } = useModuleSidebarState()

  return (
    <>
      <header className="flex-between flex w-full">
        <div className="flex min-w-0 items-end">
          <h1 className="truncate text-2xl font-semibold xl:text-3xl">
            {t(
              `sidebar.${_.camelCase(
                `${filter.category ? 'Filtered' : 'All'} ${RESOURCE_TYPES[type || 'rp'][0]}`
              )}`
            )}
          </h1>
          <span className="text-bg-500 mr-8 ml-2 text-base">
            ({filteredAndFlattenedEntries.length})
          </span>
        </div>
        <Button
          className="lg:hidden"
          icon="tabler:menu"
          variant="plain"
          onClick={() => {
            setIsSidebarOpen(true)
          }}
        />
      </header>
      <TagsFilter
        availableFilters={{
          category: {
            data: filteredAndFlattenedEntries.map(e => ({
              id: e.categoryPath.join(','),
              label: (
                <>
                  {e.categoryPath.map((path, index) => (
                    <span key={path} className="flex items-center gap-0.5">
                      {path}
                      {index < e.categoryPath.length - 1 && (
                        <Icon
                          className="text-bg-500"
                          icon="tabler:chevron-right"
                        />
                      )}
                    </span>
                  ))}
                </>
              ),
              icon: 'tabler:folder'
            }))
          }
        }}
        values={{
          category: filter.category
        }}
        onChange={{
          category: category =>
            updateFilter(prev => ({
              ...prev,
              category
            }))
        }}
      />
    </>
  )
}

export default InnerHeader
