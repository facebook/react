---
id: react-component
title: React.Component
layout: docs
category: Reference
permalink: docs/react-component.html
---

## React.Component

`React.Component` is an abstract base class, so it rarely makes sense to refer to `React.Component` directly. Instead, you will typically subclass it, and define at least a `render` method.

  - [`constructor(props)`](#constructor)
  - [`.componentDidMount()`](#.componentdidmount)
  - [`.componentDidUpdate(prevProps, prevState)`](#.componentdidupdateprevprops-prevstate)
  - [`.componentWillMount()`](#.componentwillmount)
  - [`.componentWillReceiveProps(nextProps)`](#.componentwillreceivepropsnextprops)
  - [`.componentWillUnmount()`](#.componentwillunmount)
  - [`.componentWillUpdate(nextProps, nextState)`](#.componentwillupdatenextprops-nextstate)
  - [`.defaultProps`](#.defaultprops)
  - [`.displayName`](#.displayName)
  - [`.forceUpdate(callback)`](#.forceupdatecallback)
  - [`.props`](#.props)
  - [`.propTypes`](#.proptypes)
  - [`.render()`](#.render)
  - [`.setState(nextState, callback)`](#.setstatenextstate-callback)
  - [`.shouldComponentUpdate(nextProps, nextState)`](#.shouldcomponentupdatenextprops-nextstate)
  - [`.state`](#.state)

### `constructor(props)`

The constructor for a React component is called before it is mounted. When implementing the constructor for a `React.Component` subclass, you should call `super(props)` before any other statement. Otherwise, `this.props` will be undefined in the constructor, which can lead to bugs.

The constructor is the right place to initialize state. It's okay to initialize state based on props. Here's an example of a valid `React.Component` subclass constructor:

```js
constructor(props) {
  super(props);
  this.state = {
    color: props.initialColor
  };
}  
```

### `.componentDidMount()`

TODO

### `.componentDidUpdate(prevProps, prevState)`

TODO

### `.componentWillMount()`

TODO

### `.componentWillReceiveProps(nextProps)`

TODO

### `.componentWillUnmount()`

TODO

### `.componentWillUpdate(nextProps, nextState)`

TODO

### `.defaultProps`

`defaultProps` can be defined as a property on the component class itself, to set the default props for the class. For example:

```js
class CustomButton extends React.Component {
  // ...
}

CustomButton.defaultProps = {
  color: 'blue'
};
```

If `props.color` is not provided, it will be set by default to `'blue'`.

### `.displayName`

The `displayName` string is used in debugging messages. JSX sets this value automatically; see [JSX in Depth](/react/docs/jsx-in-depth.html).

### `.forceUpdate(callback)`

TODO

### `.props`

`this.props` contains the props that were defined by the caller of this component. See [Components and Props](/react/docs/components-and-props.html) for an introduction to props.

In particular, `this.props.children` is a special prop, typically defined by the child tags in the JSX expression rather than in the tag itself.

### `.propTypes`

`propTypes` can be defined as a property on the component class itself, to define what types the props should be. It should be a map from prop names to types as defined in `React.PropTypes`. In development mode, when an invalid value is provided for a prop, a warning will be shown in the JavaScript console. In production mode, `propTypes` checks are skipped for efficiency.

For example, this code ensures that the `color` prop is a string:

```js
class CustomButton extends React.Component {
  // ...
}

CustomButton.propTypes = {
  name: React.PropTypes.string
};
```

### `.render()`

The `render()` method is required.

When called, it should examine `this.props` and `this.state` and return a single React element. This element can be either a representation of a native DOM component, such as `<div />`, or another composite component that you've defined yourself.

You can also return `null` or `false` to indicate that you don't want anything rendered. React will just render a comment tag. When returning `null` or `false`, `ReactDOM.findDOMNode(this)` will return `null`.

The `render()` function should be pure, meaning that it does not modify component state, it returns the same result each time it's invoked, and it does not directly interact with the browser. If you need to interact with the browser, perform your work in `componentDidMount()` or the other lifecycle methods instead. Keeping `render()` pure makes components easier to think about.

### `.setState(nextState, callback)`

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

It's also possible to pass a function with the signature `function(state, props) => newState`. This can be useful in some cases when you want to enqueue an atomic update that consults the previous value of state and props before setting any values. For instance, suppose we wanted to increment a value in state:

```javascript
this.setState((prevState, currentProps) => {
  return {myInteger: prevState.myInteger + 1};
});
```

The second parameter is an optional callback function that will be executed once `setState` is completed and the component is re-rendered.

`setState()` does not immediately mutate `this.state` but creates a pending state transition. Accessing `this.state` after calling this method can potentially return the existing value.

There is no guarantee of synchronous operation of calls to `setState` and calls may be batched for performance gains.

`setState()` will always trigger a re-render unless conditional rendering logic is implemented in `shouldComponentUpdate()`. If mutable objects are being used and the logic cannot be implemented in `shouldComponentUpdate()`, calling `setState()` only when the new state differs from the previous state will avoid unnecessary re-renders.

### `.shouldComponentUpdate(nextProps, nextState)`

TODO

### `.state`

The state contains data specific to this component that may change over time. The state should be a plain JavaScript object, with the keys defined according to the `React.Component` subclass. There are no special state keys with behavior defined by the core `React.Component` class itself.

See [State and Lifecycle](/react/docs/state-and-lifecycle.html) for more information about the state.

Never mutate `this.state` directly, as calling `setState()` afterwards may replace the mutation you made. Treat `this.state` as if it were immutable.
