/** Register only the production worker; dev/HMR must not be intercepted. */
export function registerOfflineWorker(): void {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    const register = () => {
        void navigator.serviceWorker
            .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
            .catch(error => console.error('Не удалось включить оффлайн-режим', error))
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
}
