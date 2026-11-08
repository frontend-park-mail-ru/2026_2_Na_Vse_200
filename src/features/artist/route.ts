export const ARTIST_ROUTE = { name: 'artist', path: '/artists/:id', title: 'Исполнитель' } as const

export const artistHref = (id: string | number): string => `/artists/${encodeURIComponent(String(id))}`
