import { type Pack, RESOURCE_TYPES } from '@/pages/EntryList'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { Button } from 'lifeforge-ui'

function SortablePackItem({
  item,
  type,
  version,
  incompatibilityColor,
  onRemove
}: {
  item: Pack
  type: keyof typeof RESOURCE_TYPES
  version: string
  incompatibilityColor?: string
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
    transition,
    ...(incompatibilityColor && {
      backgroundColor: incompatibilityColor + '20'
    })
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
      {incompatibilityColor && (
        <Icon
          className="size-5 shrink-0"
          icon="tabler:alert-triangle"
          style={{ color: incompatibilityColor }}
        />
      )}
      <Button
        className="shrink-0 p-2!"
        icon="tabler:x"
        variant="plain"
        onClick={() => onRemove(item.name)}
      />
    </div>
  )
}

export default SortablePackItem
