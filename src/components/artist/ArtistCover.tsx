import { createElement, useState } from '@navse200/my-react'
import { Icon } from '../ui/Icon.tsx'
import type { ArtistCoverProps } from './types.ts'
import './ArtistCover.scss'

export const ArtistCover = ({ src, name, className = '' }: ArtistCoverProps) => {
    const [failedImage, setFailedImage] = useState('')
    const failImage = () => setFailedImage(src ?? '')

    return (
        <span className={`artist-cover ${className}`}>
            {src && failedImage !== src ? (
                <img className="artist-cover__image" src={src} alt={name} onError={failImage} />
            ) : (
                <Icon className="artist-cover__icon" name="music" size={24} />
            )}
        </span>
    )
}
