---
id: props-in-getInitialState-as-anti-pattern-ru-RU
title: свойства внутри getInitialState как антипаттерн
layout: tips
permalink: tips/props-in-getInitialState-as-anti-pattern-ru-RU.html
prev: componentWillReceiveProps-not-triggered-after-mounting-ru-RU.html
next: dom-event-listeners.html
---

> Примечание:
>
> На самом деле этот совет относится не только к React, такой антипаттерн часто встречается в любом другом коде. В данном случае React просто демонстрирует его более четко.

Использование свойств внутри `getInitialState` для создания состояния часто приводит к дублированию исходных значений. Так происходит потому что `getInitialState` вызывается только при первом создании компонента.

Всякий раз, когда это возможно, вычисляйте значения на лету чтобы убедиться что они не изменяются позже и вызывают проблему обслуживания.

**Плохой пример:**

```js
var MessageBox = React.createClass({
  getInitialState: function() {
    return {nameWithQualifier: 'Mr. ' + this.props.name};
  },

  render: function() {
    return <div>{this.state.nameWithQualifier}</div>;
  }
});

ReactDOM.render(<MessageBox name="Rogers"/>, mountNode);
```

Лучше:

```js
var MessageBox = React.createClass({
  render: function() {
    return <div>{'Mr. ' + this.props.name}</div>;
  }
});

ReactDOM.render(<MessageBox name="Rogers"/>, mountNode);
```

(Для более сложной логики, просто поместите вычисление в отдельный метод)

Тем не менее, это **не** является антипаттерном если указать свойство явно в качестве исходного значения для внутреннего состояния компонента.

```js
var Counter = React.createClass({
  getInitialState: function() {
    // название свойства вида initialX ясно дает понять что
    // свойство используется только для указания исходного значения
    return {count: this.props.initialCount};
  },

  handleClick: function() {
    this.setState({count: this.state.count + 1});
  },

  render: function() {
    return <div onClick={this.handleClick}>{this.state.count}</div>;
  }
});

ReactDOM.render(<Counter initialCount={7}/>, mountNode);
```
