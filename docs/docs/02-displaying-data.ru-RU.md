---
id: displaying-data
title: Ввывод данных
permalink: displaying-data.html
prev: why-react.html
next: jsx-in-depth.html
---

Самое основное что ты можешь сделать с помомщью интерфейса — это показать данные. React делает вывод данных простым и меняет интерфейс сразу, как только данные изменятся.

## Начало

Давайте рассмотрим простой пример. Создайте файл `hello-react.html` со следующим текстом:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React</title>
    <script src="https://fb.me/react-{{site.react_version}}.js"></script>
    <script src="https://fb.me/react-dom-{{site.react_version}}.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/babel">

      // ** Ваш код будет здесь! **

    </script>
  </body>
</html>
```

Далее мы сфокусируемся на JavaScript коде и вставим его в наш шаблон. Замените комментарий выше на следующий JSX-код:

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

Откройте `hello-react.html` в браузере и введите в текстовое поле свое имя. Заметьте что в интерефейсе React меняет только время — всё что вы вводите не пропадает и не меняется, хотя вы даже не написали ни строчки кода для такого его поведения. React отлично понимает что ему надо делать и делает это правильно.

Дело в том, что React не меняет DOM-дерево до тех пор, пока это не потребуется. **Чтобы отразить изменения React использует быстрое внутреннее представление DOM-дерева и максимально эффективно просчитывает как это сделать**

Введенные в компонент данные называются `props` — сокращенно от "properties". Они передаются как атрибуты в JSX коде. Вы можете считать их неизменяемыми внутри компонента, но **никогда не пишите `this.props`**.

## Компоненты как функции

Компоненты React чрезвычайно просты. Вы можете считать их простыми функциями, которые принимают `props` и `state` (см. ниже) и отрисовывают HTML. Если помнить об этом, то компоненты становятся простыми для понимания.

> Замечание:
>
> **Есть одно ограничение**: React компоненты могут отрисовывать только один корневой узел. Если вам надо вернуть сразу несколько узлов - они *должны* быть обернуты в один корневой узел.

## JSX синтаксис

Мы убеждены что компоненты — самый подходящий способ разделения отвественностей, и более удобный чем "шаблоны" и "логика вывода". Мы считаем, что разметка и код, который её генерирует взаимосвязаны и неотделимы друг от друга. Плюс, логика вывода часто бывает запутанной и использование шаблонизаторов чтобы описать её только затрудняет работу.

Мы решили, что самым лучшим вариантом будет — генерировать HTML и деревья компонентов прямо из JS кода. Так что вы сможете зайдействовать всю выразительную мощь современного языка программирования для создания интерфейсов.

Так, чтобы упростить создание узлов дерева в React, мы ввели простой **опциональный** HTML-подобный синтаксис.

**JSX позволяет вам создавать JavaScript объекты используя синтаксис HTML**. Для генерации ссылки в React вы напишете на чистом JavaScript:

`React.createElement('a', {href: 'https://facebook.github.io/react/'}, 'Hello!')`

С JSX это станет:

`<a href="https://facebook.github.io/react/">Hello!</a>`

Мы установили, что с JSX создавать React приложения проще и дизайнеров как правило устраивает его синтаксис, но у каждого свои привычки в работе, поэтому **JSX необязателен при работе с React.**

JSX очень мал. Чтобы узнать о нем больше, посмотрите на [JSX в детелях](/react/docs/jsx-in-depth.html). Или можете испытать его через [Babel REPL](https://babeljs.io/repl/).

JSX похож на HTML, но не повторяет его. Посмотрите [подводные камни JSX](/react/docs/jsx-gotchas.html) чтобы понять их ключевые различия.

[Babel предлагает несколько способов начать работу с JSX](http://babeljs.io/docs/setup/), от консольных утилит до интеграций с Ruby on Rails. Выберете тот инструмент, который лучше всего вам подходит.

## React без использования JSX

JSX полностью опционален; вам совсем необязательно использовать его вместе с React. Вы можете создавать  React элементы на чистом JavaScript используя функцию `React.createElement`, которая принимает имя тега или компонента, объект со свойствами, и опционально несколько дочерних аргументов.

```javascript
var child1 = React.createElement('li', null, 'First Text Content');
var child2 = React.createElement('li', null, 'Second Text Content');
var root = React.createElement('ul', { className: 'my-list' }, child1, child2);
ReactDOM.render(root, document.getElementById('example'));
```

Для удобства, вы можете создать сокращенные фабричные функции, чтобы создавать элементы из ваших собственных компонентов.

```javascript
var Factory = React.createFactory(ComponentClass);
...
var root = Factory({ custom: 'prop' });
ReactDOM.render(root, document.getElementById('example'));
```

В React уже есть встроенные фабрики для базовых HTML тегов:

```javascript
var root = React.DOM.ul({ className: 'my-list' },
             React.DOM.li(null, 'Text Content')
           );
```
