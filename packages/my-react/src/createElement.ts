import type { Child, Component, Key, Props, VNode } from './types.js'

/**
 * JSX вызывает эту функцию вместо React.createElement.
 * @param {string|Function} type HTML-тег или компонент.
 * @param {object|null} props Свойства элемента.
 * @param {...*} children Вложенные элементы и текст.
 * @returns {object} Виртуальный элемент.
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
 * @param {*} child Дочернее значение из JSX.
 * @returns {object|null} Виртуальный элемент или пустое место в дереве.
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
 * @param {*} text Значение, которое будет приведено к строке.
 * @returns {{type: string, props: {nodeValue: string, children: Array}}} Виртуальный текстовый узел.
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
