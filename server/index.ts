import { forgeController, forgeRouter } from '@functions/routes'
import { z } from 'zod'

import { Response } from './types/resource_pack.types'

const VERSIONS = {
  rp: [11, 21],
  dp: [13, 21],
  ct: [13, 21]
}

const list = forgeController
  .query()
  .description('List Vanilla Tweaks entries')
  .input({
    query: z.object({
      version: z.string(),
      type: z.enum(['rp', 'dp', 'ct'])
    })
  })
  .callback(async ({ query: { version, type } }) => {
    const response = await fetch(
      `https://vanillatweaks.net/assets/resources/json/${version}/${type}categories.json`
    )

    const data: Response = await response.json()

    return {
      ...data,
      versions: VERSIONS[type]
    }
  })

export default forgeRouter({ list })
