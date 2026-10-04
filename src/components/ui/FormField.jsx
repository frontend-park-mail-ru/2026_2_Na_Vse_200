import { createElement } from '../../shared/lib/my-react/index.js'

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
}) {
    const id = `${idPrefix}-${name}`
    return (
        <div className="form-field">
            <label className="form-field__label" htmlFor={id}>
                {label}
            </label>
            <input
                className="form-field__input"
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
                <p className="form-field__error" id={`${id}-error`}>
                    {error}
                </p>
            ) : null}
        </div>
    )
}
