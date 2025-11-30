import useFilter from '@/hooks/useFilter'
import type forgeAPI from '@/utils/forgeAPI'
import type { UseQueryResult } from '@tanstack/react-query'
import {
  SidebarDivider,
  SidebarItem,
  SidebarWrapper,
  WithQuery
} from 'lifeforge-ui'
import { type InferOutput, useParams } from 'shared'

import { RESOURCE_TYPES } from '../..'
import CategoriesSection from './components/CategoriesSection'

function Sidebar({
  entriesQuery
}: {
  entriesQuery: UseQueryResult<InferOutput<typeof forgeAPI.vanillaTweaks.list>>
}) {
  const { type } = useParams<{ type: keyof typeof RESOURCE_TYPES }>()

  const { filter, updateFilter } = useFilter()

  return (
    <SidebarWrapper>
      <WithQuery query={entriesQuery}>
        {data => (
          <>
            <SidebarItem
              active={!filter.category}
              icon="tabler:list"
              label={`All ${RESOURCE_TYPES[type || 'rp'][0]}`}
              namespace="apps.vanillaTweaks"
              onClick={() => {
                updateFilter({ category: '' })
              }}
            />
            <SidebarItem
              icon="tabler:heart"
              label="Favourites"
              namespace="apps.vanillaTweaks"
            />
            <SidebarDivider />
            <CategoriesSection categories={data.categories} />
          </>
        )}
      </WithQuery>
    </SidebarWrapper>
  )
}

export default Sidebar
