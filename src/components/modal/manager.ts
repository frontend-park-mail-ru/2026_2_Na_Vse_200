import { createStore } from '../../shared/lib/store.js'
import type { ElementRef, VNode } from '../../shared/lib/my-react/index.js'
import type { ModalState } from './Modal.types.ts'

const store = createStore<ModalState>({ content: null })
let dialog: HTMLDialogElement | null = null

const attach: ElementRef = element => {
    dialog = element as HTMLDialogElement | null
    if (dialog && !dialog.open) dialog.showModal()
}

const close = () => {
    if (dialog?.open) dialog.close()
    store.setState({ content: null })
}

const open = (content: VNode) => {
    if (store.getState().content) close()
    store.setState({ content })
}

export const modals = { getState: store.getState, subscribe: store.subscribe, attach, open, close }
