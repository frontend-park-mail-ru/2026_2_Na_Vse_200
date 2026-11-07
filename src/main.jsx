import { mountApp } from './app/App.jsx'
import { createAppRouter } from './app/router.js'
import { registerOfflineWorker } from './shared/offline/register.ts'
import './styles/global.css'

const dispose = mountApp(document.getElementById('root'), createAppRouter())
registerOfflineWorker()
if (import.meta.hot) import.meta.hot.dispose(dispose)
