---
id: react-component
title: React.Component
layout: docs
category: Reference
permalink: docs/react-component.html
---


[Components](/react/docs/components-and-props.html) let you split the UI into independent, reusable pieces, and think about each piece in isolation.

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

If you don't use ES6 yet, you may use the `React.createClass` helper instead:

```javascript
var Greeting = React.createClass({
  render: function() {
    return <h1>Hello, {this.props.name}</h1>;
  }
});
```

The `React.Component` reference assumes the use of ES6. The API for `React.createClass` components is similar with a few exceptions. Take a look at [Using React without ES6](/react/docs/react-without-es6.html) to learn more.

### The Component Lifecycle

Components have three main parts of their lifecycle:

* Mounting: A component is being inserted into the DOM.
* Updating: A component is being re-rendered to determine if the DOM should be updated.
* Unmounting: A component is being removed from the DOM.

React provides lifecycle methods that you can specify to hook into this process. Methods prefixed with **`will`** are called right before something happens, and methods prefixed with **`did`** are called right after something happens.

#### Mounting

React will call [`componentWillMount()`](#componentwillmount) and [`componentDidMount()`](#componentdidmount) when a component is being inserted into the DOM.

#### Updating

Changes to props or state can lead to the component being re-rendered. A re-rendering is not to be misinterpreted as an [expensive DOM change](/react/docs/rendering-elements.html#react-only-updates-whats-necessary).

 - [`componentWillReceiveProps()`](#componentwillreceivepropsnextprops) is invoked before a mounted component receives new props and can be used to update state in response to prop changes.
 - The default behavior is for a component to re-render when its state changes. Take a look at [`shouldComponentUpdate(nextProps, nextState)`](#shouldcomponentupdatenextprops-nextstate) if you need to change the default behavior.
 - [`componentWillUpdate(nextProps, nextState)`](#componentwillupdatenextprops-nextstate) can be used for preparation before an update occurs.
 - [`componentDidUpdate(prevProps, prevState)`](#componentdidupdateprevprops-prevstate) is invoked after an update and can be used to operate on the DOM after the component has been updated or to fetch new data in response to prop changes.

#### Unmounting

[`componentWillUnmount()`](#componentwillunmount) can be used to perform any cleanup, as it is invoked immediately before a component is unmounted and destroyed.

## Reference

  - [`constructor(props)`](#constructor)
  - [`componentDidMount()`](#componentdidmount)
  - [`componentDidUpdate(prevProps, prevState)`](#componentdidupdateprevprops-prevstate)
  - [`componentWillMount()`](#componentwillmount)
  - [`componentWillReceiveProps(nextProps)`](#componentwillreceivepropsnextprops)
  - [`componentWillUnmount()`](#componentwillunmount)
  - [`componentWillUpdate(nextProps, nextState)`](#componentwillupdatenextprops-nextstate)
  - [`defaultProps`](#defaultprops)
  - [`displayName`](#displayName)
  - [`forceUpdate(callback)`](#forceupdatecallback)
  - [`props`](#props)
  - [`propTypes`](#proptypes)
  - [`render()`](#render)
  - [`setState(nextState, callback)`](#setstatenextstate-callback)
  - [`shouldComponentUpdate(nextProps, nextState)`](#shouldcomponentupdatenextprops-nextstate)
  - [`state`](#state)


### `constructor(props)`

The constructor for a React component is called before it is mounted. When implementing the constructor for a `React.Component` subclass, you should call `super(props)` before any other statement. Otherwise, `this.props` will be undefined in the constructor, which can lead to bugs.

The constructor is the right place to initialize state.

It's okay to initialize state based on props if you know what you're doing. Here's an example of a valid `React.Component` subclass constructor:

```js
constructor(props) {
  super(props);
  this.state = {
    color: props.initialColor
  };
}  
```

Beware of this pattern, as it effectively "forks" the props and can lead to bugs. Instead of syncing props to state, you often want to [lift the state up](/react/docs/lifting-state-up.html).

If you "fork" props by using them for state, you might also want to implement [`componentWillReceiveProps(nextProps)`](#componentwillreceivepropsnextprops) to keep the state up-to-date with them. But lifting state up is often easier and less bug-prone.

### `componentDidMount()`

`componentDidMount()` is invoked immediately after a component is mounted. Initialization that requires DOM nodes should go here. If you need to load data from a remote endpoint, this is a good place to instantiate the network request. Setting state in this method will trigger a re-rendering.

### `componentDidUpdate(prevProps, prevState)`

`componentDidUpdate()` is invoked immediately after updating occurs. This method is not called for the initial render.

Use this as an opportunity to operate on the DOM when the component has been updated. This is also a good place to do network requests as long as you compare the current props to previous props (e.g. a network request may not be necessary if the props have not changed).

> Note
>
> `componentDidUpdate()` will not be invoked if [`shouldComponentUpdate()`](#shouldcomponentupdatenextprops-nextstate) returns false.


### `componentWillMount()`

`componentWillMount()` is invoked immediately before mounting occurs. It is called before `render()`, therefore setting state in this method will not trigger a re-rendering. Avoid introducing any side-effects or subscriptions in this method.

This is the only lifecycle hook called on server rendering. Generally, we recommend using the `constructor()` instead.

### `componentWillReceiveProps(nextProps)`

`componentWillReceiveProps()` is invoked before a mounted component receives new props. If you need to update the state in response to prop changes (for example, to reset it), you may compare `this.props` and `nextProps` and perform state transitions using `this.setState()` in this method.

Note that React may call this method even if the props have not changed, so make sure to compare the current and next values if you only want to handle changes. This may occur when the parent component causes your component to re-render.

`componentWillReceiveProps()` is not invoked if you just call `this.setState()`

### `componentWillUnmount()`

`componentWillUnmount()` is invoked immediately before a component is unmounted and destroyed. Perform any necessary cleanup in this method, such as invalidating timers, canceling network requests, or cleaning up any DOM elements that were created in `componentDidMount`

### `componentWillUpdate(nextProps, nextState)`

`componentWillUpdate()` is invoked immediately before rendering when new props or state are being received. Use this as an opportunity to perform preparation before an update occurs. This method is not called for the initial render.

Note that you cannot call `this.setState()` here. If you need to update state in response to a prop change, use `componentWillReceiveProps()` instead.

> Note
>
> `componentWillUpdate()` will not be invoked if [`shouldComponentUpdate()`](#shouldcomponentupdatenextprops-nextstate) returns false.


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

### `displayName`

The `displayName` string is used in debugging messages. JSX sets this value automatically; see [JSX in Depth](/react/docs/jsx-in-depth.html).

### `forceUpdate(callback)`

`forceUpdate()` can be invoked on any mounted component when you know that some deeper aspect of the component's state has changed without using `this.setState()`

By default, when your component's state or props change, your component will re-render. However, if these change implicitly (eg: data deep within an object changes without changing the object itself) or if your `render()` method depends on some other data, you can tell React that the component needs re-rendering by calling `forceUpdate()`

Calling `forceUpdate()` will cause `render()` to be called on the component, skipping `shouldComponentUpdate()` This will trigger the normal lifecycle methods for child components, including the `shouldComponentUpdate()` method of each child. React will still only update the DOM if the markup changes.

Normally you should try to avoid all uses of `forceUpdate()` and only read from `this.props` and `this.state` in `render()` This makes your component "pure" and your application much simpler and more efficient.

### `props`

`this.props` contains the props that were defined by the caller of this component. See [Components and Props](/react/docs/components-and-props.html) for an introduction to props.

In particular, `this.props.children` is a special prop, typically defined by the child tags in the JSX expression rather than in the tag itself.

### `propTypes`

`propTypes` can be defined as a property on the component class itself, to define what types the props should be. It should be a map from prop names to types as defined in `React.PropTypes` In development mode, when an invalid value is provided for a prop, a warning will be shown in the JavaScript console. In production mode, `propTypes` checks are skipped for efficiency.

For example, this code ensures that the `color` prop is a string:

```js
class CustomButton extends React.Component {
  // ...
}

CustomButton.propTypes = {
  name: React.PropTypes.string
};
```

### `render()`

The `render()` method is required.

When called, it should examine `this.props` and `this.state` and return a single React element. This element can be either a representation of a native DOM component, such as `<div />`, or another composite component that you've defined yourself.

You can also return `null` or `false` to indicate that you don't want anything rendered. React will just render a comment tag. When returning `null` or `false`, `ReactDOM.findDOMNode(this)` will return `null`

The `render()` function should be pure, meaning that it does not modify component state, it returns the same result each time it's invoked, and it does not directly interact with the browser. If you need to interact with the browser, perform your work in `componentDidMount()` or the other lifecycle methods instead. Keeping `render()` pure makes components easier to think about.

> Note
>
> `render()` will not be invoked if [`shouldComponentUpdate()`](#shouldcomponentupdatenextprops-nextstate) returns false.

### `setState(nextState, callback)`

```javascript
void setState(
  function|object nextState,
  [function callback]
)
```

Performs a shallow merge of nextState into current state. This is the primary method you use to trigger UI updates from event handlers and server request callbacks.

The first argument can be an object (containing zero or more keys to update) or a function (of state and props) that returns an object containing keys to update.

Here is the simple object usage:

```javascript
this.setState({mykey: 'my new value'});
```

It's also possible to pass a function with the signature `function(state, props) => newState` This can be useful in some cases when you want to enqueue an atomic update that consults the previous value of state and props before setting any values. For instance, suppose we wanted to increment a value in state:

```javascript
this.setState((prevState, currentProps) => {
  return {myInteger: prevState.myInteger + 1};
});
```

The second parameter is an optional callback function that will be executed once `setState` is completed and the component is re-rendered. Generally we recommend using `componentDidUpdate()` for such logic instead.

`setState()` does not immediately mutate `this.state` but creates a pending state transition. Accessing `this.state` after calling this method can potentially return the existing value.

There is no guarantee of synchronous operation of calls to `setState` and calls may be batched for performance gains.

`setState()` will always trigger a re-render unless `shouldComponentUpdate()` returns `false` If mutable objects are being used and conditional rendering logic cannot be implemented in `shouldComponentUpdate()`, calling `setState()` only when the new state differs from the previous state will avoid unnecessary re-renders.

### `shouldComponentUpdate(nextProps, nextState)`

Use `shouldComponentUpdate()` to let React know if a component's output is not affected by the current change in state or props. The default behavior is to re-render on every state change, and in the vast majority of cases you should rely on the default behavior.

`shouldComponentUpdate()` is invoked before rendering when new props or state are being received. Defaults to `true` This method is not called for the initial render or when `forceUpdate()` is used.

Returning `false` does not prevent child components from re-rendering when *their* state changes.

Currently, if `shouldComponentUpdate()` returns `false`, then `componentWillUpdate()`, `render()`, and `componentDidUpdate()` will not be invoked. Note that in the future React may treat `shouldComponentUpdate()` as a hint rather than a strict directive, and returning `false` may still result in a re-rendering of the component.

If you determine a specific component is slow after profiling, you may change it to inherit from `React.PureComponent` which implements `shouldComponentUpdate()` with a shallow prop and state comparison. If you are confident you want to write it by hand, you may compare `this.props` with `nextProps` and `this.state` with `nextState` and return `false` to tell React the update can be skipped.

### `state`

The state contains data specific to this component that may change over time. The state should be a plain JavaScript object, with the keys defined according to the `React.Component` subclass. There are no special state keys with behavior defined by the core `React.Component` class itself.

See [State and Lifecycle](/react/docs/state-and-lifecycle.html) for more information about the state.

Never mutate `this.state` directly, as calling `setState()` afterwards may replace the mutation you made. Treat `this.state` as if it were immutable.
