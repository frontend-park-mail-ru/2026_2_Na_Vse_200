import { createElement, useState } from '@navse200/my-react'
import { Icon } from '../ui/Icon.tsx'
import { API_ORIGIN } from '../../config.ts'
import type { ArtistCoverProps } from './types.ts'
import './ArtistCover.scss'

export const ArtistCover = ({ src, name, className = '' }: ArtistCoverProps) => {
    const [failedImage, setFailedImage] = useState('')
    const image = src?.startsWith('/') ? API_ORIGIN.replace(/\/$/, '') + src : src
    const failImage = () => setFailedImage(image ?? '')

    return (
        <span className={`artist-cover ${className}`}>
            {image && failedImage !== image ? (
                <img className="artist-cover__image" src={image} alt={name} onError={failImage} />
            ) : (
                <Icon className="artist-cover__icon" name="music" size={24} />
            )}
        </span>
    )
}
