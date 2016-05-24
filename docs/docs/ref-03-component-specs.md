---
id: component-specs
title: Component Specs and Lifecycle
permalink: component-specs.html
prev: component-api.html
next: tags-and-attributes.html
---

## Component Specifications

When creating a component class by invoking `React.createClass()`, you should provide a specification object that contains a `render` method and can optionally contain other lifecycle methods described here.

> Note:
>
> It is also possible to use plain JavaScript classes as component classes. These classes can implement most of the same methods, though there are some differences. For more information about these differences, please read our documentation about [ES6 classes](/react/docs/reusable-components.html#es6-classes).

### render

```javascript
ReactElement render()
```

The `render()` method is required.

When called, it should examine `this.props` and `this.state` and return a single child element. This child element can be either a virtual representation of a native DOM component (such as `<div />` or `React.DOM.div()`) or another composite component that you've defined yourself.

You can also return `null` or `false` to indicate that you don't want anything rendered. Behind the scenes, React renders a `<noscript>` tag to work with our current diffing algorithm. When returning `null` or `false`, `ReactDOM.findDOMNode(this)` will return `null`.

The `render()` function should be *pure*, meaning that it does not modify component state, it returns the same result each time it's invoked, and it does not read from or write to the DOM or otherwise interact with the browser (e.g., by using `setTimeout`). If you need to interact with the browser, perform your work in `componentDidMount()` or the other lifecycle methods instead. Keeping `render()` pure makes server rendering more practical and makes components easier to think about.


### getInitialState

```javascript
object getInitialState()
```

Invoked once before the component is mounted. The return value will be used as the initial value of `this.state`.


### getDefaultProps

```javascript
object getDefaultProps()
```

Invoked once and cached when the class is created. Values in the mapping will be set on `this.props` if that prop is not specified by the parent component (i.e. using an `in` check).

This method is invoked before any instances are created and thus cannot rely on `this.props`. In addition, be aware that any complex objects returned by `getDefaultProps()` will be shared across instances, not copied.


### propTypes

```javascript
object propTypes
```

The `propTypes` object allows you to validate props being passed to your components. For more information about `propTypes`, see [Reusable Components](/react/docs/reusable-components.html).


### mixins

```javascript
array mixins
```

The `mixins` array allows you to use mixins to share behavior among multiple components. For more information about mixins, see [Reusable Components](/react/docs/reusable-components.html).


### statics

```javascript
object statics
```

The `statics` object allows you to define static methods that can be called on the component class. For example:

```javascript
var MyComponent = React.createClass({
  statics: {
    customMethod: function(foo) {
      return foo === 'bar';
    }
  },
  render: function() {
  }
});

MyComponent.customMethod('bar');  // true
```

Methods defined within this block are _static_, meaning that you can run them before any component instances are created, and the methods do not have access to the props or state of your components. If you want to check the value of props in a static method, have the caller pass in the props as an argument to the static method.


### displayName

```javascript
string displayName
```

The `displayName` string is used in debugging messages. JSX sets this value automatically; see [JSX in Depth](/react/docs/jsx-in-depth.html#the-transform).


## Lifecycle Methods

Various methods are executed at specific points in a component's lifecycle.


### Mounting: componentWillMount

```javascript
void componentWillMount()
```

Invoked once, both on the client and server, immediately before the initial rendering occurs. If you call `setState` within this method, `render()` will see the updated state and will be executed only once despite the state change.


### Mounting: componentDidMount

```javascript
void componentDidMount()
```

Invoked once, only on the client (not on the server), immediately after the initial rendering occurs. At this point in the lifecycle, you can access any refs to your children (e.g., to access the underlying DOM representation). The `componentDidMount()` method of child components is invoked before that of parent components.

If you want to integrate with other JavaScript frameworks, set timers using `setTimeout` or `setInterval`, or send AJAX requests, perform those operations in this method.


### Updating: componentWillReceiveProps

```javascript
void componentWillReceiveProps(
  object nextProps
)
```

Invoked when a component is receiving new props. This method is not called for the initial render.

Use this as an opportunity to react to a prop transition before `render()` is called by updating the state using `this.setState()`. The old props can be accessed via `this.props`. Calling `this.setState()` within this function will not trigger an additional render.

```javascript
componentWillReceiveProps: function(nextProps) {
  this.setState({
    likesIncreasing: nextProps.likeCount > this.props.likeCount
  });
}
```

> Note:
>
> One common mistake is for code executed during this lifecycle method to assume that props have changed.  To understand why this is invalid, read [A implies B does not imply B implies A](/react/blog/2016/01/08/A-implies-B-does-not-imply-B-implies-A.html)
>
> There is no analogous method `componentWillReceiveState`. An incoming prop transition may cause a state change, but the opposite is not true. If you need to perform operations in response to a state change, use `componentWillUpdate`.


### Updating: shouldComponentUpdate

```javascript
boolean shouldComponentUpdate(
  object nextProps, object nextState
)
```

Invoked before rendering when new props or state are being received. This method is not called for the initial render or when `forceUpdate` is used.

Use this as an opportunity to `return false` when you're certain that the transition to the new props and state will not require a component update.

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return nextProps.id !== this.props.id;
}
```

If `shouldComponentUpdate` returns false, then `render()` will be completely skipped until the next state change. In addition, `componentWillUpdate` and `componentDidUpdate` will not be called.

By default, `shouldComponentUpdate` always returns `true` to prevent subtle bugs when `state` is mutated in place, but if you are careful to always treat `state` as immutable and to read only from `props` and `state` in `render()` then you can override `shouldComponentUpdate` with an implementation that compares the old props and state to their replacements.

If performance is a bottleneck, especially with dozens or hundreds of components, use `shouldComponentUpdate` to speed up your app.


### Updating: componentWillUpdate

```javascript
void componentWillUpdate(
  object nextProps, object nextState
)
```

Invoked immediately before rendering when new props or state are being received. This method is not called for the initial render.

Use this as an opportunity to perform preparation before an update occurs.

> Note:
>
> You *cannot* use `this.setState()` in this method. If you need to update state in response to a prop change, use `componentWillReceiveProps` instead.


### Updating: componentDidUpdate

```javascript
void componentDidUpdate(
  object prevProps, object prevState
)
```

Invoked immediately after the component's updates are flushed to the DOM. This method is not called for the initial render.

Use this as an opportunity to operate on the DOM when the component has been updated.


### Unmounting: componentWillUnmount

```javascript
void componentWillUnmount()
```

Invoked immediately before a component is unmounted from the DOM.

Perform any necessary cleanup in this method, such as invalidating timers or cleaning up any DOM elements that were created in `componentDidMount`.
