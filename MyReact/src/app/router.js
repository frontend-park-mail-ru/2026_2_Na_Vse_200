import { VanillaRouter } from "../shared/lib/VanillaRouter.js"

export function createAppRouter() {
    return new VanillaRouter({
        type: "history",
        routes: {
            "/": "home",
            "/tasks": "tasks",
            "/about": "about",
            "*": "not-found"
        }
    })
}
