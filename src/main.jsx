import { mountApp } from './app/App.jsx';
import { createAppRouter } from './app/router.js';
import './styles.css';

const dispose = mountApp(document.getElementById('root'), createAppRouter());
if (import.meta.hot) import.meta.hot.dispose(dispose);
