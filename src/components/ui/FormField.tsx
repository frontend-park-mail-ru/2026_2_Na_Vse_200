import { createElement } from '../../../myReact/index.ts'

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

/** @param {object} props Настройки поля, подпись, ошибка и обработчики. @returns {object} Поле с подписью и сообщением об ошибке. */
export function FormField({
    name,
    label,
    type = 'text',
    placeholder,
    autoComplete,
    error,
    onInput,
    onBlur,
    disabled,
    idPrefix = 'signup',
}: FormFieldProps) {
    const id = `${idPrefix}-${name}`
    return (
        <div className="auth-field">
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                name={name}
                type={type}
                placeholder={placeholder}
                autoComplete={autoComplete}
                required
                disabled={disabled}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${id}-error` : undefined}
                onInput={onInput}
                onBlur={onBlur}
            />
            {error ? (
                <p className="auth-field-error" id={`${id}-error`}>
                    {error}
                </p>
            ) : null}
        </div>
    )
}
