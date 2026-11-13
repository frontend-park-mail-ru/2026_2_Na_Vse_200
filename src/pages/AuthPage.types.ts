import type { User } from '../types/domain.ts'

export type AuthPageProps =
    | { mode: 'login'; notice?: string; onAuthenticated?: (user: User) => void }
    | { mode: 'signup'; onRegistered: (user: User) => void }
