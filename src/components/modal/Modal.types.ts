import type { Child, VNode } from '@navse200/my-react'

export interface ModalProps {
    title: string
    busy?: boolean
    confirmation?: boolean
    className?: string
    children?: Child
}

export interface ModalState {
    content: VNode | null
}
