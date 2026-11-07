import type { FieldErrors } from './types.ts'

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
