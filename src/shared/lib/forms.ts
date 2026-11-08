export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Неизвестная ошибка. Попробуйте ещё раз.'
}
