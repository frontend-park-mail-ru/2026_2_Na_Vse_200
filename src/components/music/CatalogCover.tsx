import { createElement } from '@navse200/my-react'
import { ArtistCover } from '../artist/ArtistCover.tsx'
import heart from '../../assets/artist/figma/playlist-heart-exact.svg'
import heroHeart from '../../assets/catalog/favorite-heart.svg'

interface Props {
    className?: string
    src?: string | null
    favorite?: boolean
    large?: boolean
}

export function CatalogCover({ className = '', src, favorite = false, large = false }: Props) {
    if (favorite) {
        return (
            <span className={`catalog-cover catalog-cover--favorite ${className}`}>
                <img src={large ? heroHeart : heart} alt="" />
            </span>
        )
    }
    return <ArtistCover className={`catalog-cover ${className}`} src={src ?? null} name="" />
}
