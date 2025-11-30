import useFilter from '@/hooks/useFilter'
import type forgeAPI from '@/utils/forgeAPI'
import { SidebarItem, SidebarTitle } from 'lifeforge-ui'
import type { InferOutput } from 'shared'

function CategoriesSection({
  categories
}: {
  categories: InferOutput<typeof forgeAPI.vanillaTweaks.list>['categories']
}) {
  const { filter, updateFilter } = useFilter()

  return (
    <>
      <SidebarTitle label="Categories" namespace="apps.vanillaTweaks" />
      {categories.map(category => (
        <SidebarItem
          key={category.category}
          active={filter.category.split(',')[0] === category.category}
          icon="tabler:folder"
          label={category.category}
          namespace={false}
          number={
            category.packs.length +
            (category.categories?.reduce(
              (acc, sub) => acc + sub.packs.length,
              0
            ) ?? 0)
          }
          subsection={category.categories?.map(subcategory => ({
            label: subcategory.category,
            namespace: false,
            icon: 'tabler:folder',
            active: filter.category.split(',')[1] === subcategory.category,
            onClick: () => {
              updateFilter({
                category: `${category.category},${subcategory.category}`
              })
            },
            amount: subcategory.packs.length
          }))}
          onClick={() => {
            updateFilter({ category: category.category })
          }}
        />
      ))}
    </>
  )
}

export default CategoriesSection
