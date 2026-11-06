import { createStore } from '../shared/lib/store.js'

export const appStore = createStore({ tracks: [], artists: [], albums: [], status: 'idle', error: '' })
