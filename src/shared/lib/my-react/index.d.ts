export interface VNode {
    type: unknown
    key?: string | number | null
    props: Record<string, unknown>
}

export function createElement(type: unknown, props: object | null, ...children: unknown[]): VNode
export function render(element: VNode | null, container: HTMLElement): void
export function useState<T>(initial: T): [T, (value: T | ((previous: T) => T)) => void]

declare global {
    namespace JSX {
        type Element = VNode

        interface IntrinsicElements {
            [tag: string]: Record<string, unknown>
        }
    }
}
