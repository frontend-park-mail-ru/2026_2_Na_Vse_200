import { createElement, useState } from '@navse200/my-react'
import { Modal } from '../modal/Modal.tsx'
import { modals } from '../modal/manager.ts'
import './LogoutDialog.scss'

export function LogoutDialog({ onConfirm }: { onConfirm: () => Promise<void> }) {
    const [state, setState] = useState({ pending: false, error: '' })
    const confirm = async (event: MouseEvent) => {
        if (state.pending) return
        const button = event.currentTarget as HTMLButtonElement
        setState({ pending: true, error: '' })
        try {
            await onConfirm()
        } catch (error) {
            if (button.isConnected)
                setState({
                    pending: false,
                    error: error instanceof Error ? error.message : 'Не удалось выйти из аккаунта. Попробуйте ещё раз.',
                })
        }
    }
    return (
        <Modal title="Вы точно хотите выйти из аккаунта?" busy={state.pending} confirmation className="logout-dialog">
            <div className="logout-dialog__actions" aria-busy={state.pending}>
                <button
                    className="logout-dialog__button logout-dialog__button--cancel"
                    type="button"
                    disabled={state.pending}
                    onClick={modals.close}
                >
                    Нет
                </button>
                <button
                    className="logout-dialog__button logout-dialog__button--confirm"
                    type="button"
                    disabled={state.pending}
                    onClick={event => void confirm(event)}
                >
                    {state.pending ? 'Выходим…' : 'Да'}
                </button>
            </div>
            {state.error ? (
                <p className="logout-dialog__error" role="alert">
                    {state.error}
                </p>
            ) : null}
        </Modal>
    )
}
