---
id: docs-advanced-components
title: Advanced Components
description: How to build advanced composite components.
layout: docs
prev: event-handling.html
next: api.html
---

Composite components extend a `ReactCompositeComponent` base class that provides
a very powerful API that makes React flexible and able to easily work with other
libraries and frameworks.

## Lifecycle Methods

Composite components can optionally implement lifecycle methods that are invoked
at various stages in the [component lifecycle](component-lifecycle.html) that
each have unique guarantees.

### Mounting

 - `getInitialState(): object` is invoked before a component is mounted.
   Stateful components should implement this and return the initial state data.
 - `componentWillMount()` is invoked immediately before mounting occurs.
 - `componentDidMount(DOMElement rootNode)` is invoked immediately after
   mounting occurs. Initialization that requires DOM nodes should go here.

### Updating

 - `componentWillReceiveProps(object nextProps)` is invoked when a mounted
   component receives new props. This method should be used to compare
   `this.props` and `nextProps` to perform state transitions using
   `this.setState()`.
 - `shouldComponentUpdate(object nextProps, object nextState): boolean` is
   invoked when a component decides whether any changes warrant an update to the
   DOM. Implement this as an optimization to compare `this.props` with
   `nextProps` and `this.state` with `nextState` and return false if React
   should skip updating.
 - `componentWillUpdate(object nextProps, object nextState)` is invoked
   immediately before updating occurs. You cannot call `this.setState()` here.
 - `componentDidUpdate(object prevProps, object prevState, DOMElement rootNode)`
   is invoked immediately after updating occurs.

### Unmounting

 - `componentWillUnmount()` is invoked immediately before a component is
   unmounted and destroyed. Cleanup should go here.

## Mounted Methods

_Mounted_ composite components also support the following methods:

 - `getDOMNode(): DOMElement` can be invoked on any mounted component in order
   to obtain a reference to its rendered DOM node.
 - `forceUpdate()` can be invoked on any mounted component when you know that
   some deeper aspect of the component's state has changed without using
   `this.setState()`.

> Note:
>
> The `DOMElement rootNode` argument of `componentDidMount()` and
> `componentDidUpdate()` is a convenience. The same node can be obtained by
> calling `this.getDOMNode()`.

## Component Refs

A common use case of event callbacks or the lifecycle methods is to operate on a
component returned by `render()`. For example, consider a search component that
should auto-focus the input once mounted:

```javascript
var SearchForm = React.createClass({
  render: function() {
    return (
      <form action={this.props.action}>
        <input type="search" placeholder="Search..." />
      </form>
    );
  },
  componentDidMount: function(rootNode) {
    var searchInput = rootNode.firstChild;
    searchInput.focus();
  }
});
```

Although this implementation works, it is fragile because `componentDidMount()`
now relies on `render()` returning a particular DOM structure.

React provides a better way for composite components to reference components
that it constructs in its `render()` method through the use of refs. A component
can assign a `ref` to any component it constructs. This will create a reference
to those components on `this.refs`. For example:

```javascript{5,10}
var SearchForm = React.createClass({
  render: function() {
    return (
      <form action={this.props.action}>
        <input type="search" placeholder="Search..." ref="searchInput" />
      </form>
    );
  },
  componentDidMount: function(rootNode) {
    var searchInput = this.refs.searchInput.getDOMNode();
    searchInput.focus();
  }
});
```

In this example, `this.refs.searchInput` will reference the `<input>` component
and is available in most lifecycle methods and event callbacks. We obtain a
reference to the `<input>`'s DOM node using `getDOMNode()`.

> Note:
>
> If you want to preserve compatibility with Google Closure Compiler's
> property crushing in `ADVANCED_OPTIMIZATIONS` mode, make sure to use string
> literals with `this.refs`.
