import useFilter from '@/hooks/useFilter'
import { useCart } from '@/providers/CartProvider'
import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { Card } from 'lifeforge-ui'
import { useParams } from 'shared'
import COLORS from 'tailwindcss/colors'

import { type Pack, RESOURCE_TYPES } from '..'

function PackItem({ entry }: { entry: Pack }) {
  const { type } = useParams<{ type: keyof typeof RESOURCE_TYPES }>()

  const {
    filter: { version }
  } = useFilter()

  const { cart, toggleInCart } = useCart()

  const inCart = cart.some(item => item.name === entry.name)

  const typeId = RESOURCE_TYPES[type || 'rp'][0].toLowerCase().replace(/ /g, '')

  return (
    <Card
      key={entry.name}
      isInteractive
      className={clsx(
        'mb-3 h-full min-w-0 flex-1 overflow-hidden p-0!',
        inCart && 'border-custom-500 border-2'
      )}
      onClick={() => toggleInCart(entry)}
    >
      {inCart && (
        <div className="bg-custom-500 absolute top-2 right-2 z-10 rounded-full p-1">
          <Icon className="size-4 text-white" icon="tabler:check" />
        </div>
      )}
      {type !== 'dp' && (
        <img
          alt=""
          className="component-bg-lighter aspect-video w-full object-cover object-center"
          referrerPolicy="no-referrer"
          src={`https://vanillatweaks.net/assets/resources/previews/${typeId}/${version}/${entry.name}.${entry.previewExtension ?? 'png'}?v1`}
        />
      )}
      <div className="relative min-w-0 p-4 pt-0">
        <div
          className={clsx(
            'flex-center component-bg-lighter ring-bg-100 dark:ring-bg-900 size-20 shrink-0 overflow-hidden rounded-md ring-4',
            type !== 'dp' ? '-mt-10' : 'mt-4',
            inCart && 'ring-custom-500'
          )}
        >
          <img
            alt=""
            className="aspect-square size-[76px] object-cover"
            referrerPolicy="no-referrer"
            src={`https://vanillatweaks.net/assets/resources/icons/${typeId}/${version}/${entry.name}.png?v1`}
          />
        </div>
        <p className="text-custom-500 mt-4 mb-1 flex flex-wrap items-center gap-1 text-sm font-medium whitespace-nowrap">
          {entry.categoryPath.map((cat, idx) => (
            <>
              {cat}
              {idx < entry.categoryPath.length - 1 && (
                <Icon
                  className="text-bg-500 size-4"
                  icon="tabler:chevron-right"
                />
              )}
            </>
          ))}
        </p>
        <h3 className="w-full min-w-0 text-lg font-semibold">
          {entry.display}
          {entry.version && (
            <span className="text-bg-500 ml-2 text-sm font-normal">
              v{entry.version}
            </span>
          )}
        </h3>
        {entry.description && (
          <p
            className="text-bg-500 mt-2"
            dangerouslySetInnerHTML={{
              __html: entry.description
                .replace('#f98100', COLORS.orange[500])
                .replace('#ff0000', COLORS.rose[500])
            }}
          />
        )}
        {entry.video && (
          <a
            className="text-custom-500 mt-4 inline-block text-sm underline"
            href={entry.video}
            rel="noreferrer noopener"
            target="_blank"
            onClick={e => e.stopPropagation()}
          >
            Watch Preview Video
          </a>
        )}
      </div>
    </Card>
  )
}

export default PackItem
