import type { Child, Component, Key, Props, VNode } from './types.js'

/**
 * JSX вызывает эту функцию вместо React.createElement.
 * @param type HTML-тег или компонент.
 * @param props Свойства элемента; key сохраняет идентичность элемента в списке.
 * @param children Дочерние элементы и текст.
 * @returns Виртуальный узел без создания DOM.
 */
export function createElement<P extends object>(
    type: string | Component<P>,
    props: (P & { key?: Key }) | null,
    ...children: Child[]
): VNode {
    const { key = null, ...elementProps } = props ?? {}

    return {
        type: type as string | Component,
        key,

        props: {
            ...elementProps,

            children: ((children as unknown[]).flat(Infinity) as Exclude<Child, Child[]>[]).map(normalizeChild),
        } as Props,
    }
}

/**
 * Оставляет элементы как есть, превращает текст в узел, а пустые значения и boolean — в null.
 */
function normalizeChild(child: Exclude<Child, Child[]>): VNode | null {
    if (child === null || child === undefined || typeof child === 'boolean') {
        return null
    }

    if (typeof child === 'object' && child !== null) {
        return child
    }

    return createTextElement(child)
}

/**
 * Оборачивает значение в текстовый узел для render.
 */
function createTextElement(text: string | number): VNode {
    return {
        type: 'TEXT_ELEMENT',

        props: {
            nodeValue: String(text),
            children: [],
        },
    }
}
