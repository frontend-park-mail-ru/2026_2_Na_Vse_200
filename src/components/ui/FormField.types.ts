export interface FormFieldProps {
    name: string
    label: string
    type?: 'text' | 'email' | 'password'
    placeholder?: string
    autoComplete?: string
    error?: string
    onInput?: (event: Event) => void
    onBlur?: (event: FocusEvent) => void
    disabled?: boolean
    idPrefix?: string
}
