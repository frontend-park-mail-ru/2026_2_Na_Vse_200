import './ArtistCover.css'
import { createElement, useState } from '@navse200/my-react'
import { Icon } from '../ui/Icon.jsx'

interface Props {
    src: string | null
    name: string
    className?: string
}

export function ArtistCover({ src, name, className = '' }: Props) {
    const [failedImage, setFailedImage] = useState('')

    return (
        <span className={`artist-cover ${className}`}>
            {src && failedImage !== src ? (
                <img className="artist-cover__image" src={src} alt={name} onError={() => setFailedImage(src)} />
            ) : (
                <Icon name="music" size={24} label={undefined} />
            )}
        </span>
    )
}
