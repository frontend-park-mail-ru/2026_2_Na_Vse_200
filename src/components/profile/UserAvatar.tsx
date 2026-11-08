import { createElement, useState } from '@navse200/my-react'
import type { UserAvatarProps } from './UserAvatar.types.ts'
import './UserAvatar.scss'
import { API_ORIGIN } from '../../config.ts'

export const UserAvatar = ({ src, className = '' }: UserAvatarProps) => {
    const [failed, setFailed] = useState('')
    const image = src?.startsWith('/') ? API_ORIGIN.replace(/\/$/, '') + src : src
    const imageError = () => setFailed(image ?? '')

    return (
        <span className={`user-avatar ${className}`} aria-hidden="true">
            {image && failed !== image ? (
                <img src={image} alt="" onError={imageError} />
            ) : (
                <svg viewBox="0 0 80 80" fill="none">
                    <circle cx="40" cy="40" r="31" stroke="currentColor" stroke-width="6" />
                    <circle cx="40" cy="31" r="12" fill="currentColor" />
                    <path d="M16 60c3-12 12-18 24-18s21 6 24 18a31 31 0 0 1-48 0Z" fill="currentColor" />
                </svg>
            )}
        </span>
    )
}
