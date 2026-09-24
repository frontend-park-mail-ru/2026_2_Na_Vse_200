# myReact

Локальный учебный UI-движок. Приложение импортирует его через `index.js`.

- `createElement(type, props, ...children)` создаёт элемент виртуального дерева.
- `render(element, container)` отображает и согласует дерево с DOM.
- `useState(initialValue)` хранит состояние функции-компонента.

JSX преобразуется Vite в вызовы `createElement`. Сам движок не зависит от страниц, роутера или компонентов приложения.