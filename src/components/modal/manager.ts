import { createStore } from '../../shared/lib/store.ts'
import type { ElementRef, VNode } from '@navse200/my-react'
import type { ModalState } from './Modal.types.ts'

const store = createStore<ModalState>({ content: null })
let dialog: HTMLDialogElement | null = null

let stopTrackingPlayer: (() => void) | undefined

const attach: ElementRef = element => {
    stopTrackingPlayer?.()
    stopTrackingPlayer = undefined
    dialog = element instanceof HTMLDialogElement ? element : null
    if (!dialog) return
    const current = dialog

    // Open after the renderer has finished inserting and ordering the dialog node.
    queueMicrotask(() => {
        if (dialog !== current || !current.isConnected) return
        const player = current.parentElement?.querySelector('.app-shell__player')
        if (player) {
            const updatePosition = () => {
                const reservedSpace = window.innerHeight - player.getBoundingClientRect().top + 12
                current.style.setProperty('--modal-bottom', `${Math.max(16, reservedSpace)}px`)
            }
            updatePosition()
            const observer = new ResizeObserver(updatePosition)
            observer.observe(player)
            window.addEventListener('resize', updatePosition)
            stopTrackingPlayer = () => {
                observer.disconnect()
                window.removeEventListener('resize', updatePosition)
            }
        }
        if (!current.open) current.showModal()
    })
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
