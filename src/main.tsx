import { mountApp } from './app/App.tsx'
import { createAppRouter } from './app/router.ts'
import './styles/global.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root container #root was not found')
const dispose = mountApp(container, createAppRouter())
if (import.meta.hot) import.meta.hot.dispose(dispose)
