import type { HomePageProps, CollectionItem, CatalogStatus } from '../types/domain.ts'

export interface CoverProps {
    cover?: string | null
    className?: string
    icon?: string
}

export type TrackListProps = Required<
    Pick<HomePageProps, 'tracks' | 'onTrackSelect' | 'tracksStatus' | 'tracksError' | 'onTracksRetry'>
> &
    Pick<HomePageProps, 'activeTrack'>

export interface CollectionProps {
    title: string
    items: CollectionItem[]
    type: 'artist' | 'album'
    tracksStatus: CatalogStatus
}
