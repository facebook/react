---
id: children-props-type-ru-RU
title: Тип свойства дочерних элементов
layout: tips
permalink: tips/children-props-type-ru-RU.html
prev: style-props-value-px-ru-RU.html
next: controlled-input-null-value.html
---

Обычно свойство дочерних элементов (`this.props.children`) это массив из компонентов:

```js
var GenericWrapper = React.createClass({
  componentDidMount: function() {
    console.log(Array.isArray(this.props.children)); // => true
  },

  render: function() {
    return <div />;
  }
});

ReactDOM.render(
  <GenericWrapper><span/><span/><span/></GenericWrapper>,
  mountNode
);
```

Если у компонента есть только один дочерний элемент, `this.props.children` возвращает этот элемент _без оборачивания в массив_. Это экономит ресурсы, которые выделяются на создание массива.

```js
var GenericWrapper = React.createClass({
  componentDidMount: function() {
    console.log(Array.isArray(this.props.children)); // => false

    // предупреждение: возвращает 5 в качестве длины строки 'hello', а не 1
    // так как единственный элемент не оборачивается в массив
    console.log(this.props.children.length);
  },

  render: function() {
    return <div />;
  }
});

ReactDOM.render(<GenericWrapper>hello</GenericWrapper>, mountNode);
```

Для более удобной работы с `this.props.children` используйте [утилиты React.Children](/react/docs/top-level-api.html#react.children).
