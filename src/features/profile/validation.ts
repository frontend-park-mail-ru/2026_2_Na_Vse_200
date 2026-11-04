import type { FieldErrors } from './types.ts'

export function validateProfile(name: string, avatar: File | null = null) {
    const displayName = name.trim()
    const errors: FieldErrors = {}
    const length = Array.from(displayName).length

    if (length < 2 || length > 50) {
        errors.display_name = 'Имя должно содержать от 2 до 50 символов'
    }
    if (avatar && !['image/jpeg', 'image/png'].includes(avatar.type)) {
        errors.avatar = 'Выберите изображение JPG или PNG'
    }
    if (avatar?.size === 0) errors.avatar = 'Выбранный файл пуст'

    return { name: displayName, errors }
}
