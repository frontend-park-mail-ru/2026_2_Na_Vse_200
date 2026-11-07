import type { User } from '../features/profile/types.ts'

export interface ProfilePageProps {
    user: User
    onUserUpdated: (user: User) => void
    onSessionExpired: () => void
    onAccountDeleted: () => void
    onLogout: () => void
    authAction: boolean
}
