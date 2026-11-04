import { createElement, useState } from '../../shared/lib/my-react/index.js'
import './UserAvatar.css'

interface Props {
    src?: string | null
    className?: string
}

export function UserAvatar({ src, className = '' }: Props) {
    const [failed, setFailed] = useState('')

    return (
        <span className={`user-avatar ${className}`} aria-hidden="true">
            {src && failed !== src ? (
                <img src={src} alt="" onError={() => setFailed(src)} />
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
