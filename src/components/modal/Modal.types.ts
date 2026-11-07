import type { Child, VNode } from '../../../myReact/index.ts'

export interface ModalProps {
    title: string
    busy?: boolean
    className?: string
    children?: Child
}

export interface ModalState {
    content: VNode | null
}
