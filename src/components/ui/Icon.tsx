import { createElement } from '@navse200/my-react'

const glyphs = {
    chevronRight: ['m9 4 8 8-8 8'],
    heart: ['M20.8 8.8c0 4.4-8.8 10.2-8.8 10.2S3.2 13.2 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z'],
    play: ['m8 5 11 7-11 7V5Z'],
    more: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
    music: ['M9 18V5l12-2v13', 'M9 18a3 3 0 1 1-3-3c1.7 0 3 .9 3 2Z', 'M21 16a3 3 0 1 1-3-3c1.7 0 3 .9 3 2Z'],
    artist: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0'],
    queue: ['M4 5h16', 'M4 12h16', 'M4 19h16'],
}

export type IconName = keyof typeof glyphs

interface IconProps {
    name: IconName
    size?: number
    className?: string
    label?: string
}

export const Icon = ({ name, size = 20, className = '', label }: IconProps) => (
    <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden={label ? undefined : 'true'}
        aria-label={label}
        role={label ? 'img' : undefined}
        focusable="false"
    >
        <g>
            {glyphs[name].map((d, index) => (
                <path d={d} key={`${name}-${index}`} />
            ))}
        </g>
    </svg>
)
