# @navse200/my-react

Самостоятельный ESM-пакет собственного JSX-движка. Исходники написаны на TypeScript;
сборка выпускает JavaScript и декларации типов в `dist/`. Зависимостей времени выполнения нет.

```ts
import { createElement, render, useState } from '@navse200/my-react'
import type { VNode } from '@navse200/my-react'
```

Публичный API: `createElement`, `render`, `useState` и типы виртуального дерева/состояния.
JSX компилируется с фабрикой `createElement`. В приложении должна быть одна копия пакета:
renderer хранит один корень. `render(null, container)` удаляет дерево.

Из корня репозитория:

```sh
npm install
npm run build --workspace @navse200/my-react
npm pack --workspace @navse200/my-react
```

`npm pack` создаёт архив со сборкой и типами. Его можно установить в другой проект
через `npm install /path/to/navse200-my-react-1.0.0.tgz`. Публикация в npm не требуется;
`private: true` предотвращает случайную публикацию. Для сборки используется TypeScript
из зависимостей workspace; в приложение подключается готовый JS.
