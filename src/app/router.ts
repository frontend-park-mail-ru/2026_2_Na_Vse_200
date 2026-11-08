import { VanillaRouter } from '../shared/lib/VanillaRouter.ts'

export const createAppRouter = () =>
    new VanillaRouter({
        type: 'history',
        routes: {
            '/': 'home',
            '/profile': 'profile',
            '/signup': 'signup',
            '/login': 'login',
            '/artists/:id': 'artist',
            '*': 'not-found',
        },
    })
