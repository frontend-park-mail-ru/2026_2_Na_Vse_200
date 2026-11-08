import type { User } from '../../types/domain.ts'

export interface SidebarProps {
    user: User | null
    route: string
    className?: string
}
