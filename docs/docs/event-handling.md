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

### Common Patterns

With React your event handlers should be quite small. Large event handlers may
be symptomatic of code that should be moved into helpers or into `render()`.
Here are some common usage patterns for event handlers.

#### Updating State

The most common thing to do in response to a user action is to call
`this.setState()` to update the component's state, which will in turn trigger
an update to the rendered component.

#### Server Requests

Many event handlers will issue a server request to read or write some data in
response to an event. The response handler for the request will often call
`this.setState()`.

#### Invoke a Callback

Your component will often be a small, reusable building block that does not know
how to respond to a user action. In these situations, we delegate the
responsibility to the owner by exposing a handler on `this.props`. This is what
the `ToggleLink` example above is doing.

#### Inter-component Communication

A common scenario involves communicating to **Component A** that a user action
has occurred on **Component B**. To solve this problem, a common parent to
both components should listen for the event on **Component B**, update its
internal state, and pass that data into **Component A**.

For example, say we have two components: **Clicker**, a component that fires an
`onCountChange` custom event, and **ClickCountLabel**, a component that displays
the number of clicks that have happened:

```javascript
var Clicker = React.createClass({
  getInitialState: function() {
    return {count: 0};
  },
  render: function() {
    return <span onClick={this.handleClick}>Click me!</span>;
  },
  handleClick: React.autoBind(function() {
    this.setState({count: this.state.count + 1});
    if (this.props.onCountChange) {
      this.props.onCountChange(this.state.count);
    }
  })
});

var ClickCountLabel = React.createClass({
  render: function() {
    return <p>You have clicked <strong>{this.props.count}</strong> times.</p>;
  }
});

var ClickApp = React.createClass({
  render: function() {
    var count = 0;
    return (
      <div>
        <Clicker onCountChange={this.handleCountChange} />
        <ClickCountLabel count={count} />
      </div>
    );
  },
  handleCountChange: React.autoBind(function(count) {
    // Somehow update `count`.
  })
});
```

In order to communicate the click count from `Clicker` to `ClickCountLabel`, we
modify `ClickApp` to maintain state that will be passed into `ClickCountLabel`:

```javascript{2-4,6,15}
var ClickApp = React.createClass({
  getInitialState: function() {
    return {count: 0};
  },
  render: function() {
    var count = this.state.count;
    return (
      <div>
        <Clicker onCountChange={this.handleCountChange} />
        <ClickCountLabel count={count} />
      </div>
    );
  },
  handleCountChange: React.autoBind(function(count) {
    this.setState({count: count});
  })
});
```

Now when `Clicker` fires the `onCountChange` event, the `ClickCountLabel` will
get updated!
