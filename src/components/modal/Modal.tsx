import { createElement } from '@navse200/my-react'
import { modals } from './manager.ts'
import type { ModalProps } from './Modal.types.ts'
import './Modal.scss'

export const Modal = ({ title, busy = false, className = '', children }: ModalProps) => {
    const close = () => {
        if (!busy) modals.close()
    }
    const cancel = (event: Event) => {
        event.preventDefault()
        close()
    }
    const closed = (event: Event) => {
        if ((event.currentTarget as HTMLDialogElement).isConnected) modals.close()
    }

    return (
        <dialog
            className={'modal ' + className}
            aria-labelledby="modal-title"
            ref={modals.attach}
            onCancel={cancel}
            onClose={closed}
        >
            <header className="modal__header">
                <h2 id="modal-title">{title}</h2>
                <button className="modal__close" type="button" aria-label="Закрыть" onClick={close} disabled={busy}>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="m4 4 16 16M20 4 4 20" stroke="currentColor" stroke-width="2" />
                    </svg>
                </button>
            </header>
            {children}
        </dialog>
    )
}
