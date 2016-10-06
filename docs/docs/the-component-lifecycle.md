---
id: the-component-lifecycle
title: The Component Lifecycle
permalink: docs/the-component-lifecycle.html
prev: react-without-jsx.html
---

Components have three main parts of their lifecycle:

* **[Mounting](#mounting):** A component is being inserted into the DOM.
* **[Updating](#updating):** A component is being re-rendered to determine if the DOM should be updated.
* **[Unmounting](#unmounting):** A component is being removed from the DOM.

React provides lifecycle methods that you can specify to hook into this process. Methods prefixed with **`will`** are called right before something happens, and methods prefixed with **`did`** are called right after something happens.

## Mounting

These methods are called when a component is being inserted into the DOM.

```js{4-5}
class Counter extends React.Component {
  // ...

  componentWillMount() { }
  componentDidMount() { }

  // ...
}
```

### Before the component is mounted

`componentWillMount()` is invoked immediately before mounting occurs. This is the only lifecycle hook called on server rendering.

### After the component is mounted

`componentDidMount()` is invoked immediately after mounting occurs. Initialization that requires DOM nodes should go here.

### Setting the initial state for a stateful component

In ES6 classes, you can define the initial state by assigning `this.state` in the constructor:

```js{4}
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {count: props.initialCount};
  }
  // ...
}
```

If you're using `React.createClass()`, however, you can use the legacy `getInitialState()` lifecycle method to provide the initial state for your component before it is mounted.

```js{2-4}
var Counter = React.createClass({
  getInitialState: function() {
    return {count: this.props.initialCount};
  },
  // ...
});
```

## Updating

These methods are called when a component is being re-rendered and are used to determine if the DOM should be updated.

```js{4-6}
class Counter extends React.Component {
  // ...

  componentWillReceiveProps(nextProps) { }
  componentWillUpdate(nextProps, nextState) { }
  componentDidUpdate(nextProps, nextState) { }

  // ...
}
```

### Before a component receives new props

`componentWillReceiveProps(object nextProps)` is invoked before a mounted component receives new props. If you need to update the state in response to prop changes (for example, to reset it), you may compare `this.props` and `nextProps` and perform state transitions using `this.setState()` in this method.

Note that React may call this method even if the props have not changed, so make sure to compare the previous and current values if you only want to handle changes.

### Before a component is updated

`componentWillUpdate(object nextProps, object nextState)` is invoked immediately before updating occurs. You cannot call `this.setState()` here.

### After a component is updated

`componentDidUpdate(object prevProps, object prevState)` is invoked immediately after updating occurs.

### Hinting if a component needs updating

`shouldComponentUpdate(object nextProps, object nextState): boolean` Lets the component provide a **hint** to React whether its or its children's output is affected by the current change in state or props. It defaults to `true`, and in the vast majority of cases you should rely on the default behavior.

```js{4-6}
class Counter extends React.Component {
  // ...

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  // ...
}
```

If you determine a specific component is slow after profiling, you may change it to inherit from `React.PureComponent` which implements `shouldComponentUpdate()` with a shallow prop and state comparison. If you are confident you want to write it by hand, you may compare `this.props` with `nextProps` and `this.state` with `nextState` and return `false` to tell React the update can be skipped.

Returning `false` does not prevent child components from re-rendering when *their* state changes.

Note that React treats `shouldComponentUpdate()` as a hint rather than a strict directive, and may update your component anyway.

### Forcing an update

Mounted composite components also support the following method.

```js{1}
component.forceUpdate()
```

`component.forceUpdate()` can be invoked on any mounted component when you know that some deeper aspect of the component's state has changed without using `this.setState()`.

## Unmounting

These methods are called when a component is being removed from the DOM.

```js{4}
class Counter extends React.Component {
  // ...

  componentWillUnmount(nextProps) { }

  // ...
}
```

### Before a component is unmounted

`componentWillUnmount()` is invoked immediately before a component is unmounted and destroyed. Cleanup should go here.
