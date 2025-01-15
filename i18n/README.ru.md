# [React](https://react.dev/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![(Runtime) Build and Test](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml/badge.svg)](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml) [![(Compiler) TypeScript](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml/badge.svg?branch=main)](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://legacy.reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

React — это библиотека JavaScript для создания пользовательских интерфейсов.

* **Декларативный:** React упрощает создание интерактивных пользовательских интерфейсов. Проектируйте простые представления для каждого состояния вашего приложения, и React эффективно обновит и отобразит правильные компоненты, когда ваши данные изменятся. Декларативные представления делают ваш код более предсказуемым, простым для понимания и отладки.
* **Компонентный подход:** Создавайте инкапсулированные компоненты, которые управляют своим собственным состоянием, а затем объединяйте их для создания сложных пользовательских интерфейсов. Поскольку логика компонентов написана на JavaScript, а не на шаблонах, вы можете легко передавать богатые данные через приложение и сохранять состояние вне DOM.
* **Учитесь один раз, используйте везде:** Мы не делаем предположений о вашей технологической среде, поэтому вы можете разрабатывать новые функции в React, не переписывая существующий код. React также может рендерить на сервере с использованием [Node](https://nodejs.org/en) и поддерживать мобильные приложения с использованием [React Native](https://reactnative.dev/).

[Узнайте, как использовать React в вашем проекте](https://react.dev/learn).

## Установка

React был разработан для постепенного внедрения с самого начала, и **вы можете использовать React настолько мало или настолько много, насколько вам нужно:**

* Используйте [Быстрый старт](https://react.dev/learn), чтобы ознакомиться с React.
* [Добавьте React в существующий проект](https://react.dev/learn/add-react-to-an-existing-project), чтобы использовать React частично или полностью.
* [Создайте новое React-приложение](https://react.dev/learn/start-a-new-react-project), если вы ищете мощный инструмент для работы с JavaScript.

## Документация

Вы можете найти документацию по React [на сайте](https://react.dev/).

Ознакомьтесь с разделом [Быстрый старт](https://react.dev/learn) для получения общего представления.

Документация разделена на несколько частей:

* [Быстрый старт](https://react.dev/learn)
* [Учебник](https://react.dev/learn/tutorial-tic-tac-toe)
* [Думай как React](https://react.dev/learn/thinking-in-react)
* [Установка](https://react.dev/learn/installation)
* [Описание интерфейса](https://react.dev/learn/describing-the-ui)
* [Добавление интерактивности](https://react.dev/learn/adding-interactivity)
* [Управление состоянием](https://react.dev/learn/managing-state)
* [Расширенные руководства](https://react.dev/learn/escape-hatches)
* [Справочник API](https://react.dev/reference/react)
* [Где получить поддержку](https://react.dev/community)
* [Руководство по участию](https://legacy.reactjs.org/docs/how-to-contribute.html)

Вы можете улучшить документацию, отправив запросы на добавление изменений в [этот репозиторий](https://github.com/reactjs/react.dev).

## Примеры

На [сайте](https://react.dev/) представлены несколько примеров. Вот первый из них, чтобы начать:

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

Этот пример отобразит "Hello Taylor" в контейнере на странице.

Вы заметите, что мы использовали синтаксис, похожий на HTML; [мы называем его JSX](https://react.dev/learn#writing-markup-with-jsx). JSX не является обязательным для использования React, но он делает код более читаемым, и его написание похоже на написание HTML.

## Участие

Основная цель этого репозитория — продолжать развивать ядро React, делая его быстрее и проще в использовании. Разработка React осуществляется открыто на GitHub, и мы благодарны сообществу за их вклад в исправление ошибок и улучшения. Читайте далее, чтобы узнать, как вы можете принять участие в улучшении React.

### [Кодекс поведения](https://code.fb.com/codeofconduct)

Facebook принял кодекс поведения, которому, как мы ожидаем, будут следовать участники проекта. Пожалуйста, прочитайте [полный текст](https://code.fb.com/codeofconduct), чтобы понять, какие действия будут и не будут приниматься.

### [Руководство по участию](https://legacy.reactjs.org/docs/how-to-contribute.html)

Прочтите наше [руководство по участию](https://legacy.reactjs.org/docs/how-to-contribute.html), чтобы узнать о нашем процессе разработки, как предлагать исправления ошибок и улучшения, а также как создавать и тестировать ваши изменения в React.

### [Задачи для новичков](https://github.com/facebook/react/labels/good%20first%20issue)

Чтобы помочь вам начать и познакомиться с нашим процессом участия, у нас есть список [задач для новичков](https://github.com/facebook/react/labels/good%20first%20issue), которые содержат ошибки с относительно ограниченным охватом. Это отличное место для начала.

### Лицензия

React распространяется по лицензии [MIT](./LICENSE).
