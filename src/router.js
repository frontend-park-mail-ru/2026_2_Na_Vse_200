import { API_URL } from './config.js';

function setPage(content) {
    document.querySelector('#app').innerHTML = content;
}

async function renderHome() {
  setPage(`
    <section class="page">
      <h1>Главная страница</h1>
      <p id="backend-status">Проверяем backend...</p>
    </section>
  `);

  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();

    document.querySelector('#backend-status').textContent =
      `Backend ответил: ${data.message}`;
  } catch (error) {
    document.querySelector('#backend-status').textContent =
      'Не удалось подключиться к backend';

    console.error(error);
  }
}

function renderSignup() {
    setPage(`
        <section class="page">
            <h1>Регистрация</h1>
            <p>Форма регистрации</p>
        </section>
    `);    
}

function renderLogin() {
    setPage(`
        <section class="page">
            <h1>Вход</h1>
            <p>Форма входа</p>
        </section>
    `);    
}

function renderNotFound() {
    setPage(`
        <section class="page">
            <h1>404</h1>
            <p>Страница не найдена</p>
            <a href = "/" data-link>Вернуться на главную</a>
        </section>
    `);    
}

const routes = {
    '/': renderHome,
    '/signup': renderSignup,
    '/login': renderLogin,
}

export function renderRoute(path) {
  const render = routes[path] || renderNotFound;
  render();
}