import { z } from 'zod'

import { forgeController, forgeRouter } from '@functions/routes'

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

const TYPE_MAP: Record<string, string> = {
  rp: 'resourcepacks',
  dp: 'datapacks',
  ct: 'craftingtweaks'
}

const download = forgeController
  .mutation()
  .description('Download Vanilla Tweaks pack')
  .input({
    body: z.object({
      version: z.string(),
      type: z.enum(['rp', 'dp', 'ct']),
      packs: z.record(z.string(), z.array(z.string()))
    })
  })
  .callback(async ({ body: { version, type, packs } }) => {
    const typeName = TYPE_MAP[type]

    const formData = new URLSearchParams({
      packs: JSON.stringify(packs),
      version
    })

    const response = await fetch(
      `https://vanillatweaks.net/assets/server/zip${typeName}.php`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      }
    )

    const data: { link: string; status: string } = await response.json()

    return {
      link: data.link,
      status: data.status
    }
  })

export default forgeRouter({ list, download })
