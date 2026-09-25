import { VanillaRouter } from '../shared/lib/VanillaRouter.js';

/**
 * Create the single History API router shared by all pages.
 * @returns {VanillaRouter} Router; mountApp starts listening after rendering.
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
    });
}
