import { createElement } from '@navse200/my-react'
import { ArtistCover } from './ArtistCover.tsx'
import type { ArtistAlbumsProps } from './types.ts'
import './ArtistAlbums.scss'

export const ArtistAlbums = ({ albums }: ArtistAlbumsProps) => {
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
                    <strong className="artist-albums__title" title={album.title}>
                        {album.title}
                    </strong>
                    <p className="artist-albums__artist" title={album.artist}>
                        {album.artist}
                    </p>
                </article>
            ))}
        </div>
    )
}
