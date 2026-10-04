import { createElement } from '../../shared/lib/my-react/index.js'

const glyphs = {
    home: ['M3 10.8 12 3l9 7.8', 'M5.5 9.5v10h13v-10', 'M9.5 19.5v-6h5v6'],
    search: ['M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z', 'm16 16 5 5'],
    library: ['M8 3h13v14H8z', 'M4 7v14h13', 'M13 12V6l5-1v6', 'M13 12a2 2 0 1 1-2-2c1.1 0 2 .6 2 2Z'],
    chevronRight: ['m9 4 8 8-8 8'],
    plus: ['M12 5v14', 'M5 12h14'],
    heart: ['M20.8 8.8c0 4.4-8.8 10.2-8.8 10.2S3.2 13.2 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z'],
    star: ['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z'],
    moon: ['M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z'],
    sparkle: [
        'm12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z',
        'm19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
    ],
    play: ['m8 5 11 7-11 7V5Z'],
    pause: ['M8 5h3v14H8z', 'M15 5h3v14h-3z'],
    more: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
    music: ['M9 18V5l12-2v13', 'M9 18a3 3 0 1 1-3-3c1.7 0 3 .9 3 2Z', 'M21 16a3 3 0 1 1-3-3c1.7 0 3 .9 3 2Z'],
    artist: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0'],
    queue: ['M4 5h16', 'M4 12h16', 'M4 19h16'],
    volume: ['M4 10v4h4l5 4V6l-5 4H4Z', 'M17 9a5 5 0 0 1 0 6', 'M19 5a10 10 0 0 1 0 14'],
}

const customGlyphs = new Map()
const allowedElements = new Set(['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'])

/**
 * Добавляет свою SVG-иконку в набор.
 * Имена атрибутов — как в SVG: `stroke-width`, `fill`.
 *
 * registerIcon("brand", {
 *     viewBox: "0 0 24 24",
 *     elements: [{ tag: "path", attributes: { d: "M4 4h16v16H4z", fill: "currentColor", stroke: "none" } }]
 * })
 */
export function registerIcon(name, definition) {
    if (typeof name !== 'string' || !name.trim()) {
        throw new TypeError('An icon name must be a non-empty string.')
    }

    if (!definition || typeof definition !== 'object' || !Array.isArray(definition.elements)) {
        throw new TypeError('An icon definition must contain an elements array.')
    }

    const elements = definition.elements.map((element, index) => {
        if (!element || !allowedElements.has(element.tag)) {
            throw new TypeError(`Unsupported SVG element at index ${index}.`)
        }

        const attributes = element.attributes ?? {}
        if (Object.keys(attributes).some(attribute => /^on/i.test(attribute))) {
            throw new TypeError('Event handler attributes are not allowed in SVG icons.')
        }

        return { tag: element.tag, attributes: { ...attributes } }
    })

    customGlyphs.set(name, {
        viewBox: definition.viewBox ?? '0 0 24 24',
        transform: definition.transform,
        elements,
    })
}

function getIconDefinition(name) {
    const customDefinition = customGlyphs.get(name)
    if (customDefinition) return customDefinition

    const paths = glyphs[name] ?? glyphs.sparkle
    return {
        viewBox: '0 0 24 24',
        elements: paths.map(d => ({ tag: 'path', attributes: { d } })),
    }
}

registerIcon('trackPrevious', {
    viewBox: '0 0 33 30',
    elements: [
        {
            tag: 'path',
            attributes: {
                d: 'M26.75 3.75L9.25 15L26.75 26.25V3.75Z',
                fill: 'currentColor',
                stroke: 'currentColor',
                'stroke-width': '4',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
            },
        },
        {
            tag: 'line',
            attributes: {
                x1: '2',
                y1: '1',
                x2: '2',
                y2: '29',
                stroke: 'currentColor',
                'stroke-width': '4',
            },
        },
    ],
})

registerIcon('trackNext', {
    viewBox: '0 0 33 30',
    elements: [
        {
            tag: 'path',
            attributes: {
                d: 'M6.25 3.75L23.75 15L6.25 26.25V3.75Z',
                fill: 'currentColor',
                stroke: 'currentColor',
                'stroke-width': '4',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
            },
        },
        {
            tag: 'line',
            attributes: {
                x1: '31',
                y1: '1',
                x2: '31',
                y2: '29',
                stroke: 'currentColor',
                'stroke-width': '4',
            },
        },
    ],
})
export function Icon({ name, size = 20, className = '', label }) {
    const definition = getIconDefinition(name)

    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox={definition.viewBox}
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
            <g transform={definition.transform}>
                {definition.elements.map((element, index) => {
                    const SvgElement = element.tag
                    return <SvgElement {...element.attributes} key={`${name}-${index}`} />
                })}
            </g>
        </svg>
    )
}
