import { createElement, useState } from '../../../myReact/index.ts'
import type { UserAvatarProps } from './UserAvatar.types.ts'
import './UserAvatar.css'

export const UserAvatar = ({ src, className = '' }: UserAvatarProps) => {
    const [failed, setFailed] = useState('')
    const imageError = () => setFailed(src ?? '')

    return (
        <span className={`user-avatar ${className}`} aria-hidden="true">
            {src && failed !== src ? (
                <img src={src} alt="" onError={imageError} />
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
