import { RESOURCE_TYPES, type Pack } from '@/pages/EntryList'
import { useSortable } from '@dnd-kit/sortable'
import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { Button } from 'lifeforge-ui'
import { CSS } from '@dnd-kit/utilities'
import { memo } from 'react'

const SortablePackItem = memo(function SortablePackItem({
  item,
  type,
  version,
  onRemove
}: {
  item: Pack
  type: keyof typeof RESOURCE_TYPES
  version: string
  onRemove: (name: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.name })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const typeId = RESOURCE_TYPES[type || 'rp'][0].toLowerCase().replace(/ /g, '')

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'component-bg-lighter flex items-center gap-3 rounded-lg p-3',
        isDragging && 'z-50 opacity-80 shadow-lg'
      )}
      style={style}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-bg-500 hover:text-bg-300 cursor-grab touch-none active:cursor-grabbing"
      >
        <Icon className="size-5" icon="tabler:grip-vertical" />
      </div>
      <div className="bg-bg-200 dark:bg-bg-700 size-10 shrink-0 overflow-hidden rounded-md">
        <img
          alt={item.display}
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          src={`https://vanillatweaks.net/assets/resources/icons/${typeId}/${version}/${item.name}.png?v1`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.display}</p>
        <p className="text-bg-500 truncate text-sm">
          {item.categoryPath.join(' > ')}
        </p>
      </div>
      <Button
        className="shrink-0 p-2!"
        icon="tabler:x"
        variant="plain"
        onClick={() => onRemove(item.name)}
      />
    </div>
  )
})

export default SortablePackItem
