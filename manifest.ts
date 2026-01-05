import { lazy } from 'react'
import type { ModuleConfig } from 'shared'

export default {
  routes: {
    '/': lazy(() => import('@')),
    '/:type': lazy(() => import('@/pages/EntryList'))
  },
  subsection: [
    { icon: 'tabler:texture', label: 'Resource Packs', path: 'rp' },
    { icon: 'tabler:database', label: 'Data Packs', path: 'dp' },
    { icon: 'tabler:hammer', label: 'Crafting Tweaks', path: 'ct' }
  ]
} satisfies ModuleConfig
