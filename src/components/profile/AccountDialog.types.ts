import type { AccountAction, AccountValues, FieldErrors, User } from '../../features/profile/types.ts'

export interface AccountDialogProps {
    action: AccountAction
    user: User
    onSuccess: (user?: User) => void
    onExpired: () => void
}

export interface AccountDialogState {
    values: AccountValues
    errors: FieldErrors
    message: string
    pending: boolean
}

export interface AccountField {
    name: keyof AccountValues
    label: string
    type: 'email' | 'password'
    autoComplete: string
}
