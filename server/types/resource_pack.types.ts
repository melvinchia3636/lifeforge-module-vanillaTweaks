export interface Response {
  categories: Category[]
}

export interface Category {
  category: string
  categories?: Category[]
  packs: Pack[]
  warning?: Warning
}

export interface Pack {
  name: string
  display: string
  description: string
  version?: string
  incompatible: string[]
  video?: string
  videoText?: string
  priority?: number
  experiment?: boolean
  previewExtension?: string
}

export interface Warning {
  color: string
  text: string
}
