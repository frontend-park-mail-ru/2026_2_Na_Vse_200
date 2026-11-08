# На все 200

Фронтенд музыкального сервиса 2une. TypeScript, Vite, Babel, SCSS и собственный JSX-движок.

## Запуск

Нужны Node.js 24.11+, npm и запущенный бэкенд на `http://127.0.0.1:8080`.

```sh
npm ci
npm start
```

Откройте адрес Vite, обычно `http://127.0.0.1:5173`.
В PowerShell при блокировке `npm.ps1` используйте `npm.cmd`.

Запросы `/api` и `/health` проксируются на локальный бэкенд.
Для другого адреса API скопируйте `.env.example` в `.env.local` и задайте
`VITE_API_ORIGIN` без `/api/v1`. После изменения перезапустите Vite.
Музыка и изображения берутся из бэкенда: пустая база даст пустой каталог.

## Проверка и сборка

```sh
npm run lint
npm run build
npm run preview
```

`build` проверяет типы и собирает сайт в `dist/`. `preview` запускает готовую сборку.
На сервере маршруты приложения должны возвращать `index.html`, а `/sw.js` — JavaScript.

## Разработка

- Стили — SCSS, классы — по БЭМ. Общие цвета заданы в `src/styles/global.scss`, размеры экранов — в `_breakpoints.scss`.
- JSX-движок находится в `packages/my-react` и подключён через npm workspaces. После его изменения при работающем Vite выполните `npm run build:packages`. Подробнее — [README пакета](packages/my-react/README.md).
- Offline работает в production-сборке через Service Worker и IndexedDB. Для проверки откройте нужные экраны онлайн через `preview`, затем отключите сеть и перезагрузите страницу. Аудио отдельно не сохраняется. На публичном сервере нужен HTTPS.

## Команда

- [Федоров Федор](https://github.com/1ffedor)
- [Сайфетдинов Андрей](https://github.com/Andre1ka11)
- [Кузнецов Станислав](https://github.com/Stadmi)
- [Селибов Артём](https://github.com/BezFantasii)

## Ссылки

- [Бэкенд](https://github.com/go-park-mail-ru/2026_2_Na_Vse_200)
- [Figma](https://www.figma.com/design/a6FEt86x6uF36jjA64WcW8/MUSIC?node-id=0-1&t=Yrg1OBQLQ2NnfmIr-0)
- [Сайт](http://176.57.214.167/)

Ветки называются `MUSIC-###`, PR — `MUSIC-###: описание задачи`.
Для слияния в `main` нужен апрув [Ярослава](https://t.me/ykarmannikov).
