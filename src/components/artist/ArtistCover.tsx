import './ArtistCover.scss'
import { createElement, useState } from '@navse200/my-react'
import { Icon } from '../ui/Icon.tsx'
import { API_ORIGIN } from '../../config.ts'

interface Props {
    src: string | null
    name: string
    className?: string
}

export function ArtistCover({ src, name, className = '' }: Props) {
    const [failedImage, setFailedImage] = useState('')
    const image = src?.startsWith('/') ? API_ORIGIN.replace(/\/$/, '') + src : src

    return (
        <span className={`artist-cover ${className}`}>
            {image && failedImage !== image ? (
                <img
                    className="artist-cover__image"
                    src={image}
                    alt={name}
                    onError={() => setFailedImage(image)}
                />
            ) : (
                <Icon name="music" size={24} label={undefined} />
            )}
        </span>
    )
}
