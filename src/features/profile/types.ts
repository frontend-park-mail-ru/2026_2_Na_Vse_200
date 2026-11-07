export type { User } from '../../types/domain.ts'

export type AccountAction = 'email' | 'password' | 'delete'

export interface AccountValues {
    email: string
    current_password: string
    new_password: string
    confirm_password: string
}

export type FieldErrors = Partial<Record<'display_name' | 'avatar' | keyof AccountValues, string>>
