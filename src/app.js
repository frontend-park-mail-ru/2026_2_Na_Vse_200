import { renderRoute } from "./router.js";

function navigate(path) {
  window.history.pushState({}, '', path);
  renderRoute(path);
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-link]');

  if (!link) {
    return;
  }

  event.preventDefault();

  const path = link.getAttribute('href');
  navigate(path);
});

window.addEventListener('popstate', () => {
  renderRoute(window.location.pathname);
});

renderRoute(window.location.pathname);
