import './ArtistAlbums.css'
import { createElement } from '../../shared/lib/my-react/index.js'
import { ArtistCover } from './ArtistCover.tsx'
import type { ArtistAlbum } from '../../features/artist/types.ts'

interface Props {
    albums: ArtistAlbum[]
}

export function ArtistAlbums({ albums }: Props) {
    if (!albums.length) return <p className="artist-albums__empty">У исполнителя пока нет альбомов.</p>

    return (
        <div className="artist-albums">
            {albums.map(album => (
                <article className="artist-albums__card" key={album.id}>
                    <ArtistCover
                        className="artist-albums__cover"
                        src={album.cover_url}
                        name={`Обложка ${album.title}`}
                    />
                    <strong className="artist-albums__title">{album.title}</strong>
                    <p className="artist-albums__artist">{album.artist}</p>
                </article>
            ))}
        </div>
    )
}
