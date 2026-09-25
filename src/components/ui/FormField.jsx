import { createElement } from '../../../index.js';

/** @param {object} props Input attributes, label, error and callbacks. @returns {object} Accessible field. */
export function FormField({ name, label, type = 'text', placeholder, autoComplete, error, onInput, onBlur, disabled, idPrefix = 'signup' }) {
    const id = `${idPrefix}-${name}`;
    return <div className="signup-field">
        <label htmlFor={id}>{label}</label>
        <input id={id} name={name} type={type} placeholder={placeholder}
            autoComplete={autoComplete} required disabled={disabled}
            aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${id}-error` : undefined}
            onInput={onInput} onBlur={onBlur} />
        {error ? <p className="signup-field-error" id={`${id}-error`}>{error}</p> : null}
    </div>;
}
