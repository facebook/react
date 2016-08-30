---
id: displaying-data-ru-RU
title: Отображение данных
permalink: docs/displaying-data-ru-RU.html
prev: why-react-ru-RU.html
next: jsx-in-depth.html
---

Главная задача интерфейса — это отображать данные. React делает это легко и обновляет интерфейс сразу, как только изменятся данные.

## Начало

Давайте рассмотрим простой пример. Создайте файл `hello-react.html` со следующим текстом:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React</title>
    <script src="https://unpkg.com/react@{{site.react_version}}/dist/react.js"></script>
    <script src="https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.js"></script>
    <script src="https://unpkg.com/babel-core@5.8.38/browser.min.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/babel">

      // ** Ваш код будет здесь! **

    </script>
  </body>
</html>
```

Добавим в этот шаблон немного JavaScript. Замените комментарий на следующий JSX-код:

```javascript
var HelloWorld = React.createClass({
  render: function() {
    return (
      <p>
        Hello, <input type="text" placeholder="Your name here" />!
        It is {this.props.date.toTimeString()}
      </p>
    );
  }
});

setInterval(function() {
  ReactDOM.render(
    <HelloWorld date={new Date()} />,
    document.getElementById('example')
  );
}, 500);
```

## Реактивные обновления

Откройте `hello-react.html` в браузере и введите в текстовое поле свое имя. Что происходит со страницей? Каждые полсекунды обновляется время, остальные же части страницы остаются без изменений. Обратите внимание, что мы не написали ни строчки кода, чтобы управлять этим поведением. React сам отлично понимает что надо делать и обновляет элементы на странице по мере необходимости.

Суть в том, что React не меняет DOM-дерево до тех пор, пока это не потребуется. **Чтобы отразить изменения, React использует быстрое внутреннее представление DOM-дерева и просчитывает как его изменить наиболее эффективно**.

Передаваемые в компонент данные называются `props` — сокращенно от "properties". В JSX коде они передаются как атрибуты компонента. Считайте, что компонент получает `props` только для чтения. **Никогда не перезаписывайте значения `this.props` внутри компонента.**

## Компоненты как функции

Компоненты React — довольно простые сущности. Можно считать их обыкновенными функциями, которые принимают на входе `props` и `state` (см. далее) и возвращают HTML. Если помнить об этом, то компоненты становятся простыми для понимания.

> Замечание:
>
> **Есть одно ограничение**: Компоненты React умеют возвращать только один узел. Если вам надо вернуть сразу несколько, они *должны* быть обернуты в один корневой узел.

## Синтаксис JSX

Мы убеждены, что компоненты — самый подходящий способ разделения ответственностей, гораздо более удобный чем "шаблоны" и "вынесение логики на страницу". Мы считаем, что разметка и код, который её генерирует, неотделимы друг от друга. Плюс, логика на странице часто бывает запутанной, и использование шаблонизаторов, чтобы описать её, только затрудняет работу.

Мы решили, что лучшим вариантом будет генерировать HTML и деревья компонентов прямо из JS кода. Так вы сможете зайдействовать всю выразительную мощь современного языка программирования для создания интерфейсов.

А чтобы упростить создание узлов дерева, мы ввели **опциональный** HTML-подобный синтаксис.

**JSX позволяет вам создавать JavaScript объекты используя синтаксис HTML**. Для генерации ссылки в React вы напишете на чистом JavaScript:

`React.createElement('a', {href: 'https://facebook.github.io/react/'}, 'Hello!')`

С JSX это станет:

`<a href="https://facebook.github.io/react/">Hello!</a>`

Мы установили, что с JSX создавать React приложения проще, и дизайнеров как правило устраивает его синтаксис. Но у разных людей разные предпочтения, поэтому стоит сказать, что **JSX необязателен при работе с React.**

JSX сам по себе очень прост. Чтобы узнать о нем больше, почитайте [подробно про JSX](/react/docs/jsx-in-depth.html). Или можете попробовать его в [Babel REPL](https://babeljs.io/repl/).

JSX похож на HTML, но но имеет существенные отличия. Почитайте про [подводные камни JSX](/react/docs/jsx-gotchas.html), чтобы понять их ключевые различия.

[Babel предлагает несколько способов начать работу с JSX](http://babeljs.io/docs/setup/), от консольных утилит до интеграций с Ruby on Rails. Выберите тот инструмент, который лучше всего вам подходит.

## React без использования JSX

JSX полностью опционален; вам совсем необязательно использовать его вместе с React. Вы можете создавать React-элементы на чистом JavaScript используя функцию `React.createElement`, которая принимает имя тега или компонента, объект со свойствами, и набор необязательных дочерних элементов.

```javascript
var child1 = React.createElement('li', null, 'First Text Content');
var child2 = React.createElement('li', null, 'Second Text Content');
var root = React.createElement('ul', { className: 'my-list' }, child1, child2);
ReactDOM.render(root, document.getElementById('example'));
```

Для удобства, вы можете создать сокращенные фабричные функции, чтобы создавать React-элементы из ваших собственных компонентов.

```javascript
var Factory = React.createFactory(ComponentClass);
...
var root = Factory({ custom: 'prop' });
ReactDOM.render(root, document.getElementById('example'));
```

А для базовых HTML тегов в React уже есть встроенные фабрики:

```javascript
var root = React.DOM.ul({ className: 'my-list' },
             React.DOM.li(null, 'Text Content')
           );
```
