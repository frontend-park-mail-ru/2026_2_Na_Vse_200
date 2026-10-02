import { VanillaRouter } from '../shared/lib/VanillaRouter.js'

/**
 * Один роутер на всё приложение, без хешей в URL.
 * @returns {VanillaRouter} Роутер. Обработку событий запускает mountApp после отрисовки.
 */
export function createAppRouter() {
    return new VanillaRouter({
        type: 'history',
        routes: {
            '/': 'home',
            '/signup': 'signup',
            '/login': 'login',
            '*': 'not-found',
        },
    })
}
