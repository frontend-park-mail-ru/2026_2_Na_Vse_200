import type { AccountProps } from '../../types/domain.ts'

export interface SidebarProps extends Pick<AccountProps, 'user'> {
    route: string
    className?: string
}
