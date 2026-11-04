export interface User {
    id: string
    email: string
    display_name: string
    avatar_url: string | null
}

export type FieldErrors = Partial<Record<'display_name' | 'avatar', string>>
