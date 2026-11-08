import type { AccountAction, AccountValues, FieldErrors } from './types.ts'

export const validateProfile = (name: string, avatar: File | null = null) => {
    const displayName = name.trim()
    const errors: FieldErrors = {}
    const length = Array.from(displayName).length

    if (length < 2 || length > 50) {
        errors.display_name = 'Имя должно содержать от 2 до 50 символов'
    }
    if (avatar && !['image/jpeg', 'image/png', 'image/webp'].includes(avatar.type)) {
        errors.avatar = 'Выберите изображение JPG, PNG или WebP'
    }
    if (avatar && avatar.size > 2 * 1024 * 1024) errors.avatar = 'Размер изображения должен быть не больше 2 МБ'
    if (avatar?.size === 0) errors.avatar = 'Выбранный файл пуст'

    return { name: displayName, errors }
}

export const validateAccount = (action: AccountAction, values: AccountValues) => {
    const email = values.email.trim().toLowerCase()
    const errors: FieldErrors = {}
    if (!values.current_password) errors.current_password = 'Введите текущий пароль'
    if (action === 'email') {
        if (email.length < 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Введите корректный e-mail'
        }
    }
    if (action === 'password') {
        const length = Array.from(values.new_password).length
        if (length < 8 || !/\p{L}/u.test(values.new_password) || !/\p{Nd}/u.test(values.new_password)) {
            errors.new_password = 'Минимум 8 символов, хотя бы одна буква и цифра'
        }
        if (new TextEncoder().encode(values.new_password).length > 72) errors.new_password = 'Пароль слишком длинный'
        if (values.new_password !== values.confirm_password) errors.confirm_password = 'Пароли не совпадают'
    }
    return { email, errors }
}
