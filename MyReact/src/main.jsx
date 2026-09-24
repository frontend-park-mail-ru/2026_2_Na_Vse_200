import { mountApp } from "./app/App.jsx"
import { createAppRouter } from "./app/router.js"
import "./styles/global.css"

const root = document.getElementById("root")
const router = createAppRouter()

mountApp(root, router)
