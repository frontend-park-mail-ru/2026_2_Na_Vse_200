import { createElement, render, useState } from "../../myReact/index.js"
import { AppLayout } from "../components/layout/AppLayout.jsx"
import { HomePage } from "../pages/HomePage.jsx"
import { TasksPage } from "../pages/TasksPage.jsx"
import { AboutPage } from "../pages/AboutPage.jsx"
import { NotFoundPage } from "../pages/NotFoundPage.jsx"

const pages = {
    home: HomePage,
    tasks: TasksPage,
    about: AboutPage,
    "not-found": NotFoundPage
}

function App({ route }) {
    const Page = pages[route] ?? NotFoundPage

    return <AppLayout>
        <Page />
    </AppLayout>
}

export function mountApp(container, router) {
    let setRoute

    function RouterRoot() {
        const [route, updateRoute] = useState("home")
        setRoute = updateRoute
        return <App route={route} />
    }

    render(<RouterRoot />, container)

    const handleRoute = event => {
        setRoute(event.detail.route ?? "not-found")
    }

    router.on("route", handleRoute).listen()

    return () => {
        router.off("route", handleRoute).destroy()
    }
}
