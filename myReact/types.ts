export type Key = string | number | null
export type Child = VNode | string | number | boolean | null | undefined | Child[]
export interface Props {
    [name: string]: unknown
    children?: (VNode | null)[]
}
export type Component<P = Props> = (props: P) => VNode | null
export interface VNode {
    type: string | Component
    key?: Key
    props: Props
}
export type StateUpdate<S> = S | ((previous: S) => S)
export type StateSetter<S> = (update: StateUpdate<S>) => void
