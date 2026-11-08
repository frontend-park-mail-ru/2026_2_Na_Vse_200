import type { CollectionItem, CatalogStatus } from '../types/domain.ts'
import type { IconName } from '../components/ui/Icon.tsx'

export interface CoverProps {
    cover?: string | null
    icon?: IconName
}

export interface CollectionProps {
    title: string
    items: CollectionItem[]
    type: 'artist' | 'album'
    tracksStatus: CatalogStatus
}
