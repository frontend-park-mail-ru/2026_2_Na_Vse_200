/** Пустой адрес — запросы идут на текущий домен, в разработке через прокси Vite. */
export const API_ORIGIN = import.meta.env?.VITE_API_ORIGIN || ''
/** Общий префикс API. У /health префикса нет. */
export const API_URL = `${API_ORIGIN}/api/v1`

/** Отправляем cookie сессии вместе с запросами к бэкенду. */
export const API_REQUEST_OPTIONS = Object.freeze({ credentials: 'include' })
