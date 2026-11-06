import { modals } from './manager.ts'

export const ModalHost = () => modals.getState().content
