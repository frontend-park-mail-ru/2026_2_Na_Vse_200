// Типы собственного JSX-движка. Расширяйте список свойств при миграции компонентов.
export {}

interface HTMLProps {
    children?: unknown
    id?: string
    className?: string
}

declare global {
    namespace JSX {
        type Element = ReturnType<typeof import('../../createElement.ts').createElement>

        interface ElementChildrenAttribute {
            children: unknown
        }

        interface IntrinsicElements {
            div: HTMLProps
            p: HTMLProps
            label: HTMLProps & { htmlFor?: string }
            input: HTMLProps & {
                name?: string
                type?: 'text' | 'email' | 'password'
                placeholder?: string
                autoComplete?: string
                required?: boolean
                disabled?: boolean
                'aria-invalid'?: 'true' | 'false'
                'aria-describedby'?: string
                onInput?: (event: Event) => void
                onBlur?: (event: FocusEvent) => void
            }
        }
    }
}
