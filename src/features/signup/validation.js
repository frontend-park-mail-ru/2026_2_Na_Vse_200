/**
 * Normalize signup fields and collect all errors. Password whitespace is significant.
 * @param {{display_name: string, email: string, password: string}} values Form values.
 * @returns {{data: object, errors: Object<string, string>}} Request body and errors.
 */
export function validateSignup(values) {
    const data = { display_name: values.display_name.trim(), email: values.email.trim().toLowerCase(), password: values.password };
    const errors = {};
    const nameLength = Array.from(data.display_name).length;
    if (nameLength < 2 || nameLength > 50) errors.display_name = 'Имя должно содержать от 2 до 50 символов';
    if (data.email.length < 3 || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Некорректный email';
    const passwordLength = Array.from(data.password).length;
    if (passwordLength < 8 || passwordLength > 72 || !/\p{L}/u.test(data.password) || !/[0-9]/.test(data.password)) {
        errors.password = 'Пароль должен содержать от 8 до 72 символов, хотя бы одну букву и цифру';
    }
    return { data, errors };
}
