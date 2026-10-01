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
Backend для запуска каркаса не требуется.

```sh
npm run lint
npm test
npm run build
npm run preview
```

`npm run test:routes` собирает проект и автоматически проверяет прямые URL
на dev-сервере и preview. Проверка запускает временные локальные серверы и закрывает их.

Сборка находится в `dist/`. Preview проверяет готовую сборку локально (обычно порт 4173).

## Настройка API

Скопируйте `.env.example` в `.env.local` и задайте `VITE_API_ORIGIN` — адрес backend,
например `http://localhost:8080`, без `/api/v1`.
После изменения перезапустите dev-сервер или пересоберите проект.

Авторизация использует серверную cookie-сессию. Клиент передаёт запросы с
`credentials: 'include'`, восстанавливает пользователя через `/api/v1/auth/me`
при запуске и завершает сессию через `/api/v1/auth/logout`.

### Участники команды

1.  [Федоров Федор](https://github.com/1ffedor)
2.  [Сайфетдинов Андрей](https://github.com/Andre1ka11)
3.  [Кузнецов Станислав](https://github.com/Stadmi)
4.  [Селибов Артём](https://github.com/BezFantasii)

### Внешние ссылки - TODO

- [Бэкенд проекта](https://github.com/go-park-mail-ru/2026_2_Na_Vse_200)
- [Figma](https://google.com)
- [Deploy](https://google.com)

### Правила оформления Pull Requests

1. Ветка создается с названием `MUSIC-###`, где ### - номер задачи.
2. Название Pull Request'а соответствует названию задачи: `MUSIC-###: description`,
   где description - название задачи (что вы реализовали в этом Pull Request'е).
3. Для того, чтобы залить изменения в ветку main нужен апрув от [Ярослава](https://t.me/ykarmannikov)
