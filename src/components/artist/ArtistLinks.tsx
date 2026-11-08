import { createElement } from '@navse200/my-react'
import { artistHref } from '../../features/artist/route.ts'
import { getArtistName } from '../../features/music/presentation.ts'
import type { Track } from '../../types/domain.ts'
import './ArtistLinks.scss'

export function ArtistLinks({ track }: { track: Track }) {
    const artists = track.artists?.length ? track.artists : track.artist ? [track.artist] : []
    if (!artists.length) return <span>{getArtistName(track)}</span>
    return (
        <span>
            {artists.map((artist, index) => {
                const name = typeof artist === 'string' ? artist : artist.name || 'Исполнитель'
                const id = typeof artist === 'string' ? undefined : artist.id
                return (
                    <span key={id ?? `${name}-${index}`}>
                        {index > 0 ? ', ' : ''}
                        {id !== undefined ? (
                            <a className="artist-link" href={artistHref(id)} data-link>
                                {name}
                            </a>
                        ) : (
                            name
                        )}
                    </span>
                )
            })}
        </span>
    )
}
