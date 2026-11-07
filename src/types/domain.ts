/** Domain data accepted by the UI. API boundaries validate external JSON. */
export type EntityId = string | number
export interface CollectionItem {
    id: EntityId
    name?: string
    title?: string
    image_url?: string | null
    cover_url?: string | null
}
export interface Track {
    audio_url?: string | null
    id: EntityId
    title?: string
    artists?: (string | { name?: string })[]
    artist?: string | { name?: string }
    artist_name?: string
    cover_url?: string | null
    cover?: string
    image_url?: string | null
    album?: { cover_url?: string | null }
    duration?: number | string | { seconds?: number; duration_seconds?: number }
    duration_seconds?: number
    duration_ms?: number
    is_liked?: boolean
    liked?: boolean
}
export interface Catalog {
    tracks: Track[]
    artists: CollectionItem[]
    albums: CollectionItem[]
}
export type CatalogStatus = 'idle' | 'loading' | 'ready' | 'error'
export interface User {
    id?: EntityId
    display_name?: string
    email?: string
}
export type FieldErrors = Partial<Record<string, string>>
export interface FormState {
    errors: FieldErrors
    message: string
    pending: boolean
}
export interface AccountProps {
    user: User | null
    onLogout: () => void
    authAction: boolean
}
export interface HomePageProps {
    tracks?: Track[]
    artists?: CollectionItem[]
    albums?: CollectionItem[]
    activeTrack?: Track
    onTrackSelect?: (track: Track) => void
    tracksStatus?: CatalogStatus
    tracksError?: string
    onTracksRetry?: () => void
}
