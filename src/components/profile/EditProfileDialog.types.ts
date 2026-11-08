import type { FieldErrors, User } from '../../features/profile/types.ts'

export interface EditProfileDialogProps {
    user: User
    onSaved: (user: User) => void
    onUpdated?: (user: User) => void
    onExpired: () => void
}

export interface EditProfileDialogState {
    name: string
    avatar: File | null
    preview: string
    errors: FieldErrors
    message: string
    pending: boolean
    reading: boolean
}
