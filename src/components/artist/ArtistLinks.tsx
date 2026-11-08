import { createElement } from '@navse200/my-react'
import { artistHref } from '../../features/artist/route.ts'
import { getArtistName } from '../../features/music/presentation.ts'
import type { TrackArtist } from '../../types/domain.ts'
import type { ArtistLinksProps } from './types.ts'
import './ArtistLinks.scss'

const renderArtist = (artist: string | TrackArtist, index: number) => {
    const name = typeof artist === 'string' ? artist : artist.name || 'Исполнитель'
    const id = typeof artist === 'string' ? undefined : artist.id
    return (
        <span key={id ?? `${name}-${index}`}>
            {index > 0 ? ', ' : ''}
            {id !== undefined ? (
                <a className="artist-links__link" href={artistHref(id)} data-link>
                    {name}
                </a>
            ) : (
                name
            )}
        </span>
    )
}

export const ArtistLinks = ({ track }: ArtistLinksProps) => {
    const artists = track.artists?.length ? track.artists : track.artist ? [track.artist] : []
    return <span className="artist-links">{artists.length ? artists.map(renderArtist) : getArtistName(track)}</span>
}
