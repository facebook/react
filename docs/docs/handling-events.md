---
id: handling-events
title: Handling Events
permalink: docs/handling-events.html
---

Handling events with React elements is very similar to handling events on DOM elements. There are some syntactic differences:

* React events are named using camelCase, rather than lowercase.
* With JSX you pass a function as the event handler, rather than a string.

For example, the HTML:

```html
<button onclick="activateLasers()">Activate Lasers</button>
```

is slightly different in React:

```js
<button onClick={activateLasers}>Activate Lasers</button>
```

Another difference is that you cannot return `false` to prevent default behavior in React. You must call `preventDefault` explicitly. For example, with plain HTML to prevent the default link behavior this works:

```html
<a href="#" onclick="console.log('the link was clicked'); return false">
  click me
</a>
```

In React, this would instead be:

```js
function handleClick(e) {
  console.log('the link was clicked');
  e.preventDefault();
}

function CustomLink() {
  return <a href="#" onClick={handleClick}>click me</a>;
}
```

React knows how to bubble and capture events according to the [W3C spec](https://www.w3.org/TR/DOM-Level-3-Events/), so you don't need to worry about cross-browser compatibility.

When using React you should generally not need to call `addEventListener` to add listeners to a DOM element after it is created. Instead, just provide a listener when the element is initially rendered.

A common pattern is for an event handler to be a method on the React component. For example, this `Toggle` component renders a button that lets the user toggle between "ON" and "OFF" states:

```js
class Toggle extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      on: true,
    };

    // This binding is necessary to make `this` work in the callback
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState({on: !this.state.on});
  }

  render() {
    return (
      <button onClick={this.toggle}>
        {this.state.on ? 'ON' : 'OFF'}
      </button>
    );
  }
}
```

[Try it on Codepen.](http://codepen.io/lacker/pen/ORQBzB?editors=1010)

You have to be careful about the meaning of `this` in JSX callbacks. In JavaScript, class methods are not [bound](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_objects/Function/bind) by default. If you forget to bind `this.toggle` and pass it to `onClick`, `this` will be `undefined` when the function is actually called.

This is not React-specific behavior; it is a part of [how functions work in JavaScript](https://www.smashingmagazine.com/2014/01/understanding-javascript-function-prototype-bind/). Generally, if you refer to a method without `()` after it, such as `onClick={this.toggle}`, you should bind that method.

If calling `bind` annoys you, there are two ways you can get around this. If you are using [property initializer syntax](https://babeljs.io/docs/plugins/transform-class-properties/), you can use property initializers to correctly bind callbacks:

```js
class LoggingButton extends React.Component {
  // This syntax ensures `this` is bound within handleClick
  handleClick = () => {
    console.log('this is:', this);
  }

  render() {
    return <button onClick={this.handleClick} />;
  }
}
```

This syntax is enabled by default in [Create React App](https://github.com/facebookincubator/create-react-app).

If you aren't using property initializer syntax, you can use an arrow function in the callback:

```js
class LoggingButton extends React.Component {
  handleClick() {
    console.log('this is:', this);
  }

  render() {
    // This syntax ensures `this` is bound within handleClick
    return <button onClick={() => this.handleClick()} />;
  }
}
```

The problem with this syntax is that a different callback is created each time the `LoggingButton` renders. This means that during reconciliation, the child `button` will always re-render, which is bad for performance. If you don't care about performance, this syntax might be the simplest.
