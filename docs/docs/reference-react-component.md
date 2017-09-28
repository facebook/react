---
id: react-component
title: React.Component
layout: docs
category: Reference
permalink: docs/react-component.html
redirect_from:
  - "docs/component-api.html"
  - "docs/component-specs.html"
  - "docs/component-specs-ko-KR.html"
  - "docs/component-specs-zh-CN.html"
  - "tips/componentWillReceiveProps-not-triggered-after-mounting.html"
  - "tips/dom-event-listeners.html"
  - "tips/initial-ajax.html"
  - "tips/use-react-with-other-libraries.html"
---

[Components](/docs/components-and-props.html) let you split the UI into independent, reusable pieces, and think about each piece in isolation. `React.Component` is provided by [`React`](/docs/react-api.html).

## Overview

`React.Component` is an abstract base class, so it rarely makes sense to refer to `React.Component` directly. Instead, you will typically subclass it, and define at least a [`render()`](#render) method.

Normally you would define a React component as a plain [JavaScript class](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Classes):

```javascript
class Greeting extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

If you don't use ES6 yet, you may use the [`create-react-class`](/docs/react-api.html#createclass) module instead. Take a look at [Using React without ES6](/docs/react-without-es6.html) to learn more.

### The Component Lifecycle

Each component has several "lifecycle methods" that you can override to run code at particular times in the process. Methods prefixed with **`will`** are called right before something happens, and methods prefixed with **`did`** are called right after something happens.

#### Mounting

These methods are called when an instance of a component is being created and inserted into the DOM:

- [`constructor()`](#constructor)
- [`componentWillMount()`](#componentwillmount)
- [`render()`](#render)
- [`componentDidMount()`](#componentdidmount)

#### Updating

An update can be caused by changes to props or state. These methods are called when a component is being re-rendered:

- [`componentWillReceiveProps()`](#componentwillreceiveprops)
- [`shouldComponentUpdate()`](#shouldcomponentupdate)
- [`componentWillUpdate()`](#componentwillupdate)
- [`render()`](#render)
- [`componentDidUpdate()`](#componentdidupdate)

#### Unmounting

This method is called when a component is being removed from the DOM:

- [`componentWillUnmount()`](#componentwillunmount)

### Other APIs

Each component also provides some other APIs:

  - [`setState()`](#setstate)
  - [`forceUpdate()`](#forceupdate)

### Class Properties

  - [`defaultProps`](#defaultprops)
  - [`displayName`](#displayname)

### Instance Properties

  - [`props`](#props)
  - [`state`](#state)

* * *

## Reference

### `render()`

```javascript
render()
```

The `render()` method is required.

When called, it should examine `this.props` and `this.state` and return one of the following types:

- **React elements.** Typically created via JSX. An element can either be a representation of a native DOM component (`<div />`), or a user-defined composite component (`<MyComponent />`).
- **String and numbers.** These are rendered as text nodes in the DOM.
- **Portals**. Created with [`ReactDOM.createPortal`](/docs/portals.html).
- `null`. Renders nothing.
- **Booleans**. Render nothing. (Mostly exists to support `return test && <Child />` pattern, where `test` is boolean.)

When returning `null` or `false`, `ReactDOM.findDOMNode(this)` will return `null`.

The `render()` function should be pure, meaning that it does not modify component state, it returns the same result each time it's invoked, and it does not directly interact with the browser. If you need to interact with the browser, perform your work in `componentDidMount()` or the other lifecycle methods instead. Keeping `render()` pure makes components easier to think about.

> Note
>
> `render()` will not be invoked if [`shouldComponentUpdate()`](#shouldcomponentupdate) returns false.

#### Fragments

You can also return multiple items from `render()` using an array:

```javascript
render() {
  return [
    <li key="A">First item</li>,
    <li key="B">Second item</li>,
    <li key="C">Third item</li>,
  ];
}
```

> Note:
>
> Don't forget to [add keys](/docs/lists-and-keys.html#keys) to elements in a fragment to avoid the key warning.

* * *

### `constructor()`

```javascript
constructor(props)
```

The constructor for a React component is called before it is mounted. When implementing the constructor for a `React.Component` subclass, you should call `super(props)` before any other statement. Otherwise, `this.props` will be undefined in the constructor, which can lead to bugs.

The constructor is the right place to initialize state. If you don't initialize state and you don't bind methods, you don't need to implement a constructor for your React component.

It's okay to initialize state based on props. This effectively "forks" the props and sets the state with the initial props. Here's an example of a valid `React.Component` subclass constructor:

```js
constructor(props) {
  super(props);
  this.state = {
    color: props.initialColor
  };
}
```

Beware of this pattern, as state won't be up-to-date with any props update. Instead of syncing props to state, you often want to [lift the state up](/docs/lifting-state-up.html).

If you "fork" props by using them for state, you might also want to implement [`componentWillReceiveProps(nextProps)`](#componentwillreceiveprops) to keep the state up-to-date with them. But lifting state up is often easier and less bug-prone.

* * *

### `componentWillMount()`

```javascript
componentWillMount()
```

`componentWillMount()` is invoked immediately before mounting occurs. It is called before `render()`, therefore setting state synchronously in this method will not trigger a re-rendering. Avoid introducing any side-effects or subscriptions in this method.

This is the only lifecycle hook called on server rendering. Generally, we recommend using the `constructor()` instead.

* * *

### `componentDidMount()`

```javascript
componentDidMount()
```

`componentDidMount()` is invoked immediately after a component is mounted. Initialization that requires DOM nodes should go here. If you need to load data from a remote endpoint, this is a good place to instantiate the network request. Setting state in this method will trigger a re-rendering.

* * *

### `componentWillReceiveProps()`

```javascript
componentWillReceiveProps(nextProps)
```

`componentWillReceiveProps()` is invoked before a mounted component receives new props. If you need to update the state in response to prop changes (for example, to reset it), you may compare `this.props` and `nextProps` and perform state transitions using `this.setState()` in this method.

Note that React may call this method even if the props have not changed, so make sure to compare the current and next values if you only want to handle changes. This may occur when the parent component causes your component to re-render.

React doesn't call `componentWillReceiveProps` with initial props during [mounting](#mounting). It only calls this method if some of component's props may update. Calling `this.setState` generally doesn't trigger `componentWillReceiveProps`.

* * *

### `shouldComponentUpdate()`

```javascript
shouldComponentUpdate(nextProps, nextState)
```

Use `shouldComponentUpdate()` to let React know if a component's output is not affected by the current change in state or props. The default behavior is to re-render on every state change, and in the vast majority of cases you should rely on the default behavior.

`shouldComponentUpdate()` is invoked before rendering when new props or state are being received. Defaults to `true`. This method is not called for the initial render or when `forceUpdate()` is used.

Returning `false` does not prevent child components from re-rendering when *their* state changes.

Currently, if `shouldComponentUpdate()` returns `false`, then [`componentWillUpdate()`](#componentwillupdate), [`render()`](#render), and [`componentDidUpdate()`](#componentdidupdate) will not be invoked. Note that in the future React may treat `shouldComponentUpdate()` as a hint rather than a strict directive, and returning `false` may still result in a re-rendering of the component.

If you determine a specific component is slow after profiling, you may change it to inherit from [`React.PureComponent`](/docs/react-api.html#react.purecomponent) which implements `shouldComponentUpdate()` with a shallow prop and state comparison. If you are confident you want to write it by hand, you may compare `this.props` with `nextProps` and `this.state` with `nextState` and return `false` to tell React the update can be skipped.

* * *

### `componentWillUpdate()`

```javascript
componentWillUpdate(nextProps, nextState)
```

`componentWillUpdate()` is invoked immediately before rendering when new props or state are being received. Use this as an opportunity to perform preparation before an update occurs. This method is not called for the initial render.

Note that you cannot call `this.setState()` here. If you need to update state in response to a prop change, use `componentWillReceiveProps()` instead.

> Note
>
> `componentWillUpdate()` will not be invoked if [`shouldComponentUpdate()`](#shouldcomponentupdate) returns false.

* * *

### `componentDidUpdate()`

```javascript
componentDidUpdate(prevProps, prevState)
```

`componentDidUpdate()` is invoked immediately after updating occurs. This method is not called for the initial render.

Use this as an opportunity to operate on the DOM when the component has been updated. This is also a good place to do network requests as long as you compare the current props to previous props (e.g. a network request may not be necessary if the props have not changed).

> Note
>
> `componentDidUpdate()` will not be invoked if [`shouldComponentUpdate()`](#shouldcomponentupdate) returns false.

* * *

### `componentWillUnmount()`

```javascript
componentWillUnmount()
```

`componentWillUnmount()` is invoked immediately before a component is unmounted and destroyed. Perform any necessary cleanup in this method, such as invalidating timers, canceling network requests, or cleaning up any DOM elements that were created in `componentDidMount`

* * *

### `setState()`

```javascript
setState(updater, [callback])
```

`setState()` enqueues changes to the component state and tells React that this component and its children need to be re-rendered with the updated state. This is the primary method you use to update the user interface in response to event handlers and server responses.

Think of `setState()` as a *request* rather than an immediate command to update the component. For better perceived performance, React may delay it, and then update several components in a single pass. React does not guarantee that the state changes are applied immediately.

`setState()` does not always immediately update the component. It may batch or defer the update until later. This makes reading `this.state` right after calling `setState()` a potential pitfall. Instead, use `componentDidUpdate` or a `setState` callback (`setState(updater, callback)`), either of which are guaranteed to fire after the update has been applied. If you need to set the state based on the previous state, read about the `updater` argument below.

`setState()` will always lead to a re-render unless `shouldComponentUpdate()` returns `false`. If mutable objects are being used and conditional rendering logic cannot be implemented in `shouldComponentUpdate()`, calling `setState()` only when the new state differs from the previous state will avoid unnecessary re-renders.

The first argument is an `updater` function with the signature:

```javascript
(prevState, props) => stateChange
```

`prevState` is a reference to the previous state. It should not be directly mutated. Instead, changes should be represented by building a new object based on the input from `prevState` and `props`. For instance, suppose we wanted to increment a value in state by `props.step`:

```javascript
this.setState((prevState, props) => {
  return {counter: prevState.counter + props.step};
});
```

Both `prevState` and `props` received by the updater function are guaranteed to be up-to-date. The output of the updater is shallowly merged with `prevState`.

The second parameter to `setState()` is an optional callback function that will be executed once `setState` is completed and the component is re-rendered. Generally we recommend using `componentDidUpdate()` for such logic instead.

You may optionally pass an object as the first argument to `setState()` instead of a function:

```javascript
setState(stateChange, [callback])
```

This performs a shallow merge of `stateChange` into the new state, e.g., to adjust a shopping cart item quantity:

```javascript
this.setState({quantity: 2})
```

This form of `setState()` is also asynchronous, and multiple calls during the same cycle may be batched together. For example, if you attempt to increment an item quantity more than once in the same cycle, that will result in the equivalent of:

```javaScript
Object.assign(
  previousState,
  {quantity: state.quantity + 1},
  {quantity: state.quantity + 1},
  ...
)
```

Subsequent calls will override values from previous calls in the same cycle, so the quantity will only be incremented once. If the next state depends on the previous state, we recommend using the updater function form, instead:

```js
this.setState((prevState) => {
  return {counter: prevState.quantity + 1};
});
```

For more detail, see the [State and Lifecycle guide](/docs/state-and-lifecycle.html).

* * *

### `forceUpdate()`

```javascript
component.forceUpdate(callback)
```

By default, when your component's state or props change, your component will re-render. If your `render()` method depends on some other data, you can tell React that the component needs re-rendering by calling `forceUpdate()`.

Calling `forceUpdate()` will cause `render()` to be called on the component, skipping `shouldComponentUpdate()`. This will trigger the normal lifecycle methods for child components, including the `shouldComponentUpdate()` method of each child. React will still only update the DOM if the markup changes.

Normally you should try to avoid all uses of `forceUpdate()` and only read from `this.props` and `this.state` in `render()`.

* * *

## Class Properties

### `defaultProps`

`defaultProps` can be defined as a property on the component class itself, to set the default props for the class. This is used for undefined props, but not for null props. For example:

```js
class CustomButton extends React.Component {
  // ...
}

CustomButton.defaultProps = {
  color: 'blue'
};
```

If `props.color` is not provided, it will be set by default to `'blue'`:

```js
  render() {
    return <CustomButton /> ; // props.color will be set to blue
  }
```

If `props.color` is set to null, it will remain null:

```js
  render() {
    return <CustomButton color={null} /> ; // props.color will remain null
  }
```

* * *

### `displayName`

The `displayName` string is used in debugging messages. Usually, you don't need to set it explicitly because it's inferred from the name of the function or class that defines the component. You might want to set it explicitly if you want to display a different name for debugging purposes or when you create a higher-order component, see [Wrap the Display Name for Easy Debugging](/docs/higher-order-components.html#convention-wrap-the-display-name-for-easy-debugging) for details.

* * *

## Instance Properties

### `props`

`this.props` contains the props that were defined by the caller of this component. See [Components and Props](/docs/components-and-props.html) for an introduction to props.

In particular, `this.props.children` is a special prop, typically defined by the child tags in the JSX expression rather than in the tag itself.

### `state`

The state contains data specific to this component that may change over time. The state is user-defined, and it should be a plain JavaScript object.

If you don't use it in `render()`, it shouldn't be in the state. For example, you can put timer IDs directly on the instance.

See [State and Lifecycle](/docs/state-and-lifecycle.html) for more information about the state.

Never mutate `this.state` directly, as calling `setState()` afterwards may replace the mutation you made. Treat `this.state` as if it were immutable.
