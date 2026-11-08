import type { User } from '../features/profile/types.ts'

export interface ProfilePageProps {
    user: User
    onUserUpdated: (user: User) => void
    onSessionExpired: () => void
    onAccountClosed: (message: string) => void
    onLogout: () => void
    authAction: boolean
}
