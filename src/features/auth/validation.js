/** Normalize login fields and validate required values and email format. */
export function validateLogin(values) {
    const data = {
        email: values.email.trim().toLowerCase(),
        password: values.password,
    }
    const errors = {}

    if (data.email.length < 3 || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = data.email ? 'Некорректный email' : 'Введите email'
    }
    if (!data.password) errors.password = 'Введите пароль'

    return { data, errors }
}
