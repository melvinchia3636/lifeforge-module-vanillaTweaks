import { useDebounce } from '@uidotdev/usehooks'
import { type SetStateAction, useMemo } from 'react'
import { parseAsString, useQueryStates } from 'shared'

export default function useFilter() {
  const [filter, setFilter] = useQueryStates({
    q: parseAsString.withDefault(''),
    version: parseAsString.withDefault('1.21'),
    category: parseAsString.withDefault('')
  })

  const debouncedSearchQuery = useDebounce(filter.q, 300)

  const updateFilter = (
    newValues: SetStateAction<Partial<Record<keyof typeof filter, any>>>
  ) => {
    setFilter(prev => ({
      ...prev,
      ...(typeof newValues === 'function' ? newValues(prev) : newValues)
    }))
  }

  const memoizedValues = useMemo(
    () => ({
      filter,
      debouncedSearchQuery,
      updateFilter
    }),
    [filter, debouncedSearchQuery]
  )

  return memoizedValues
}
