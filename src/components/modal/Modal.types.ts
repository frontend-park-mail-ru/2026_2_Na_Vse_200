import type { VNode } from '../../shared/lib/my-react/index.js'

export interface ModalProps {
    title: string
    busy?: boolean
    className?: string
    children?: VNode | null | (VNode | null)[]
}

export interface ModalState {
    content: VNode | null
}
