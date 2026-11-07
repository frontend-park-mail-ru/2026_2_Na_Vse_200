/** A form control can also be a RadioNodeList: narrow it before reading value. */
export function getInput(form: HTMLFormElement, name: string): HTMLInputElement {
    const input = form.elements.namedItem(name)
    if (!(input instanceof HTMLInputElement)) throw new Error(`Missing input: ${name}`)
    return input
}
export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Неизвестная ошибка. Попробуйте ещё раз.'
}
