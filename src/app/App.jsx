"use strict";

import { createElement, render, useState } from "../../MyReact/index.js"
import { appStore } from "./store.js"
import { AppLayout } from "../components/layout/AppLayout.jsx"
import { HomePage } from "../pages/HomePage.jsx"
import { NotFoundPage } from "../pages/NotFoundPage.jsx"

const pages = {
    home: HomePage,
    "not-found": NotFoundPage
}

function App({ route }) {
    const tracks = appStore.getState().tracks
    const [activeTrack, setActiveTrack] = useState(tracks[0])
    const Page = pages[route] ?? NotFoundPage

    return <AppLayout activeTrack={activeTrack}>
        <Page tracks={tracks} activeTrack={activeTrack} onTrackSelect={setActiveTrack} />
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
    const unsubscribeStore = appStore.subscribe(() => {
        render(<RouterRoot />, container)
    })

    const handleRoute = event => {
        setRoute(event.detail.route ?? "not-found")
    }

    router.on("route", handleRoute).listen()

    return () => {
        unsubscribeStore()
        router.off("route", handleRoute).destroy()
    }
}
