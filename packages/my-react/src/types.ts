export type Key = string | number | null
export type Child = VNode | null
export type Props = Record<string, unknown> & { children: Child[] }
export type Component = (props: Props) => Child

export interface VNode {
    type: string | Component
    key?: Key
    props: Props
}

export type StateUpdate<T> = T | ((previous: T) => T)
export type StateSetter<T> = (value: StateUpdate<T>) => void

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace -- Classic JSX needs the global JSX namespace.
    namespace JSX {
        type Element = VNode
        interface IntrinsicElements {
            [tag: string]: Record<string, unknown>
        }
    }
}
