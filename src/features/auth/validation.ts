import type { FieldErrors } from '../../types/domain.ts'

export interface LoginValues {
    email: string
    password: string
}

export const validateLogin = (values: LoginValues) => {
    const data = { email: values.email.trim().toLowerCase(), password: values.password }
    const errors: FieldErrors = {}
    if (data.email.length < 3 || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = data.email ? 'Некорректный email' : 'Введите email'
    }
    if (!data.password) errors.password = 'Введите пароль'
    return { data, errors }
}
