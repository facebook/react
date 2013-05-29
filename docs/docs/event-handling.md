---
id: docs-event-handling
title: Event Handling
description: How do events work with React components?
layout: docs
prev: component-lifecycle.html
next: advanced-components.html
---

Events in React work the way they do with HTML, except the event names are
camelCased.

```javascript
var Clicker = React.createClass({
  render: function() {
    return <span onClick={this.handleClick}>Click me!</span>;
  },
  handleClick: function(event) {
    alert('You clicked me!');
  }
});
```

When `<Clicker>` is clicked, the `handleClick()` function will get fired. Under
the hood, React uses top-level event delegation to achieve high performance.

## Automatically Binding Callbacks

Just like any callback in JavaScript, if you want to refer to the component as
`this` from the callback, you need to bind the callback to the component:

```javascript{3}
var Clicker = React.createClass({
  render: function() {
    var handleClick = this.handleClick.bind(this);
    return <span onClick={handleClick}>Click me!</span>;
  },
  handleClick: function(event) {
    alert(this.ALERT_MESSAGE);
  },
  ALERT_MESSAGE: 'You clicked me!'
});
```

React provides a convenient and _efficient_ way to bind methods using
`React.autoBind()`:

```javascript{3,5-7}
var Clicker = React.createClass({
  render: function() {
    return <span onClick={this.handleClick}>Click me!</span>;
  },
  handleClick: React.autoBind(function(event) {
    alert(this.ALERT_MESSAGE);
  }),
  ALERT_MESSAGE: 'You clicked me!'
});
```

> Note:
>
> Binding a function allocates memory to create a new bound function. Since
> `render()` may be invoked many times, it is a bad place to bind functions.
> `React.autoBind()` sidesteps this issue by only binding once at instantiation
> time.

## DOM Events

React uses [top-level event delegation](http://davidwalsh.name/event-delegate)
to achieve high performance when implementing DOM events. For each type of DOM
event, React adds a single top-level listener and determines which event
handlers to execute by simulating event capturing and bubbling.

DOM event handlers are called with a normalized `AbstractEvent` object that has
cross-browser compatible implementations of `stopPropagation` and
`preventDefault()`. If you need access to the raw browser event, you can use the
`nativeEvent` property.

> Note:
>
> The `AbstractEvent` object is JSON serializable so that React applications can
> be executed inside web workers.

### Touch Events

If you want to use touch events, you must configure React's event system to
initialize them:

```javascript
// Invoke before calling `React.renderComponent()`.
React.initializeTouchEvents(true);
```

## Custom Events

Notice that event listeners are attached by simply passing them into components
as props. For DOM components, events are handled using top-level event
delegation. For composite components, event handling is up to the component's
implementation.

Here is an example of a toggle link that fires a custom `onToggle` event:

```javascript
var ToggleLink = React.createClass({
  getInitialState: function() {
    return {isEnabled: false};
  },
  render: function() {
    return <a onClick={this.handleClick}>Toggle</a>;
  },
  handleClick: React.autoBind(function() {
    var willEnable = !this.state.isEnabled;
    if (this.props.onToggle) {
      this.props.onToggle(willEnable)
    }
    this.setState({isEnabled: willEnable});
  })
});

var handleToggle = function(enabled) {
  alert(enabled ? 'Enabled.' : 'Disabled.');
};
var myToggleLink = <ToggleLink onToggle={handleToggle} />;
```
