import type { User } from '../types/domain.ts'

export interface LoginPageProps {
    notice?: string
    onAuthenticated?: (user: User) => void
}
