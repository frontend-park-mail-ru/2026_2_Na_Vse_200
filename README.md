# 2026_2_Na_Vse_200

Frontend репозиторий команды На все 200 с проектом Spotify/Яндекс Музыка

## Локальный запуск

Нужны Node.js 22.12+ (либо 24+) и npm. Из корня репозитория:

```sh
npm ci
npm start
```

Откройте адрес, напечатанный Vite (обычно http://127.0.0.1:5173).
В Windows PowerShell при блокировке `npm.ps1` используйте `npm.cmd` вместо `npm`.
Для входа, регистрации и проверки сессии нужен бэкенд на `http://localhost:8080`.
Vite перенаправляет на него запросы `/api` и `/health`.

```sh
npm run lint
npm test
npm run build
npm run preview
```

`npm run test:routes` собирает проект и автоматически проверяет прямые URL
на dev-сервере и preview. Проверка запускает временные локальные серверы и закрывает их.

Сборка находится в `dist/`. `npm run build` также копирует её в
`../../back/2026_2_Na_Vse_200/web/dist`, откуда бэкенд раздаёт приложение.
Preview проверяет готовую сборку локально (обычно порт 4173).

## Настройка API

Для локального запуска через прокси оставьте `VITE_API_ORIGIN` пустым.
Если API работает на отдельном домене, скопируйте `.env.example` в `.env.local`
и задайте `VITE_API_ORIGIN` — адрес бэкенда без `/api/v1`.
После изменения перезапустите dev-сервер или пересоберите проект.

Авторизация использует серверную cookie-сессию. Клиент передаёт запросы с
`credentials: 'include'`, восстанавливает пользователя через `/api/v1/auth/me`
при запуске и завершает сессию через `/api/v1/auth/logout`.

### Участники команды

1.  [Федоров Федор](https://github.com/1ffedor)
2.  [Сайфетдинов Андрей](https://github.com/Andre1ka11)
3.  [Кузнецов Станислав](https://github.com/Stadmi)
4.  [Селибов Артём](https://github.com/BezFantasii)

### Внешние ссылки

- [Бэкенд проекта](https://github.com/go-park-mail-ru/2026_2_Na_Vse_200)
- [Figma](https://www.figma.com/design/a6FEt86x6uF36jjA64WcW8/MUSIC?node-id=0-1&t=Yrg1OBQLQ2NnfmIr-0)
- [Деплой](http://176.57.214.167/)

### Правила оформления Pull Requests

1. Ветка создается с названием `MUSIC-###`, где ### - номер задачи.
2. Название Pull Request'а соответствует названию задачи: `MUSIC-###: description`,
   где description - название задачи (что вы реализовали в этом Pull Request'е).
3. Для того, чтобы залить изменения в ветку main нужен апрув от [Ярослава](https://t.me/ykarmannikov)
