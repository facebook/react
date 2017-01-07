---
id: handling-events
title: Handling Events
permalink: docs/handling-events.html
prev: state-and-lifecycle.html
next: conditional-rendering.html
redirect_from:
  - "docs/events-ko-KR.html"
---

To listen for an event in React, add an event listener to the element where it is rendered:
```js(1)
<button onClick={handleClick}>
  Activate the lasers!
</button>
```

Note there are two syntactic differences between React and regular event handling:
* React event names use camelCase instead of lowercase. `onClick`, not `onclick`
* The event handler is passed as a function, instead of a string.

in HTML:
```html
<button onclick="handleClick()">
  Activate the lasers!
</button>
```

### Preventing default behavior
Another difference in React is that an element's default behavior during an event cannot be prevented by returning `false`. `preventDefault` must be called explicitly:

```js
function handleClick (e) {
  e.preventDefault();
  console.log("The element was clicked.");
}
```

### Synthetic events
In the example above, `e` is a "synthetic event." React defines these synthetic events according to the [W3C spec](https://www.w3.org/TR/DOM-Level-3-Events/), so cross-browser compatibility is not an issue. See the [`SyntheticEvent`](/react/docs/events.html) reference guide to learn more.

When using React you should generally not need to call `addEventListener` to add listeners to a DOM element after it is created. Instead, just provide a listener when the element is initially rendered.

### Common pitfall when using ES6 class syntax
When you define a component using an [ES6 class](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Classes), a common pattern is for an event handler to be a method on the class. For example, this `Toggle` component renders a button that lets the user toggle between "ON" and "OFF" states:

```js{6,7,10-14,18}
class Toggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isToggleOn: true};

    // This binding is necessary to make `this` work in the callback
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState(prevState => ({
      isToggleOn: !prevState.isToggleOn
    }));
  }

  render() {
    return (
      <button onClick={this.handleClick}>
        {this.state.isToggleOn ? 'ON' : 'OFF'}
      </button>
    );
  }
}

ReactDOM.render(
  <Toggle />,
  document.getElementById('root')
);
```

[Try it on CodePen.](http://codepen.io/gaearon/pen/xEmzGg?editors=0010)

You have to be careful about the meaning of `this` in JSX callbacks. In JavaScript, class methods are not [bound](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_objects/Function/bind) by default. If you forget to bind `this.handleClick` and pass it to `onClick`, `this` will be `undefined` when the function is actually called.

This is not React-specific behavior; it is a part of [how functions work in JavaScript](https://www.smashingmagazine.com/2014/01/understanding-javascript-function-prototype-bind/). Generally, if you refer to a method without `()` after it, such as `onClick={this.handleClick}`, you should bind that method.

If calling `bind` annoys you, there are two ways you can get around this. If you are using the experimental [property initializer syntax](https://babeljs.io/docs/plugins/transform-class-properties/), you can use property initializers to correctly bind callbacks:

```js{2-6}
class LoggingButton extends React.Component {
  // This syntax ensures `this` is bound within handleClick.
  // Warning: this is *experimental* syntax.
  handleClick = () => {
    console.log('this is:', this);
  }

  render() {
    return (
      <button onClick={this.handleClick}>
        Click me
      </button>
    );
  }
}
```

This syntax is enabled by default in [Create React App](https://github.com/facebookincubator/create-react-app).

If you aren't using property initializer syntax, you can use an [arrow function](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Functions/Arrow_functions) in the callback:

```js{7-9}
class LoggingButton extends React.Component {
  handleClick() {
    console.log('this is:', this);
  }

  render() {
    // This syntax ensures `this` is bound within handleClick
    return (
      <button onClick={(e) => this.handleClick(e)}>
        Click me
      </button>
    );
  }
}
```

The problem with this syntax is that a different callback is created each time the `LoggingButton` renders. In most cases, this is fine. However, if this callback is passed as a prop to lower components, those components might do an extra re-rendering. We generally recommend binding in the constructor to avoid this sort of performance problem.

