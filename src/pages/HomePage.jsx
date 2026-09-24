"use strict";

import { createElement } from "../../MyReact/index.js"
import { MainPage } from "../features/mainPage/MainPage.jsx"

export function HomePage(props) {
    return <MainPage {...props} />
}