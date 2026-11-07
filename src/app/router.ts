import { VanillaRouter } from '../shared/lib/VanillaRouter.ts'

/**
 * Один роутер на всё приложение, без хешей в URL.
 * @returns {VanillaRouter} Роутер. Обработку событий запускает mountApp после отрисовки.
 */
export function createAppRouter() {
    return new VanillaRouter({
        type: 'history',
        routes: {
            '/': 'home',
            '/profile': 'profile',
            '/signup': 'signup',
            '/login': 'login',
            '*': 'not-found',
        },
    })
}
