import type { Child, Key, VNode } from './types.js'

/** JSX factory: retains component identity and normalizes nested children. */
export function createElement(type: unknown, props: object | null, ...children: unknown[]): VNode {
    const { key = null, ...elementProps } = (props ?? {}) as Record<string, unknown>
    return {
        type: type as VNode['type'],
        key: key as Key,
        props: { ...elementProps, children: children.flat(Infinity).map(normalizeChild) },
    }
}

function normalizeChild(child: unknown): Child {
    if (child === null || child === undefined || typeof child === 'boolean') return null
    if (typeof child === 'object') return child as VNode
    return { type: 'TEXT_ELEMENT', props: { nodeValue: String(child), children: [] } }
}
