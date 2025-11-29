import { lazy } from 'react'
import type { ModuleConfig } from 'shared'

export default {
  name: 'Vanilla Tweaks',
  icon: 'tabler:brush',
  routes: {
    '/': lazy(() => import('@/pages/EntryList')),
    '/:id': lazy(() => import('@/pages/EntryDetails'))
  },
  category: 'Information'
} satisfies ModuleConfig
