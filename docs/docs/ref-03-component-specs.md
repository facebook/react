---
id: component-specs
title: Component Specs and Lifecycle
layout: docs
permalink: component-specs.html
prev: component-api.html
next: tags-and-attributes.html
---

## Component Specifications

When creating a component class by invoking `React.createClass()`, you should provide a specification object that contains a `render` method and can optionally contain other lifecycle methods described here.


### render

```javascript
ReactComponent render()
```

The `render()` method is required.

When called, it should examine `this.props` and `this.state` and return a single child component. This child component can be either a native DOM component (such as `<div>`) or another composite component that you've defined yourself.

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

Invoked once when the component is mounted. Values in the mapping will be set on `this.props` if that prop is not specified by the parent component (i.e. using an `in` check).

This method is invoked before `getInitialState` and therefore cannot rely on `this.state` or use `this.setState`.


### propTypes

```javascript
object propTypes
```

The `propTypes` object allows you to validate props being passed to your components. For more information about `propTypes`, see [Reusable Components](/react/docs/reusable-components.html).

<!-- TODO: Document propTypes here directly. -->


### mixins

```javascript
array mixins
```

The `mixins` array allows you to use mixins to share behavior among multiple components. For more information about mixins, see [Reusable Components](/react/docs/reusable-components.html).

<!-- TODO: Document mixins here directly. -->


## Lifecycle Methods

Various methods are executed at specific points in a component's lifecycle.


### Mounting: componentWillMount

```javascript
componentWillMount()
```

Invoked immediately before rendering occurs. If you call `setState` within this method, `render()` will see the updated state and will be executed only once despite the state change.


### Mounting: componentDidMount

```javascript
componentDidMount()
```

Invoked immediately after rendering occurs. At this point in the lifecycle, the component has a DOM representation which you can access via `this.getDOMNode()`.

If you want to integrate with other JavaScript frameworks, set timers using `setTimeout` or `setInterval`, or send AJAX requests, perform those operations in this method.

> Note:
>
> Prior to v0.6, the DOM node was passed in as the last argument. If you were using this, you can still access the DOM node by calling `this.getDOMNode()`.


### Updating: componentWillReceiveProps

```javascript
componentWillReceiveProps(object nextProps)
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
> There is no analogous method `componentWillReceiveState`. An incoming prop transition may cause a state change, but the opposite is not true. If you need to perform operations in response to a state change, use `componentWillUpdate`.


### Updating: shouldComponentUpdate

```javascript
boolean shouldComponentUpdate(object nextProps, object nextState)
```

Invoked before rendering when new props or state are being received. This method is not called for the initial render or when `forceUpdate` is used.

Use this as an opportunity to `return false` when you're certain that the
transition to the new props and state will not require a component update.

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return !equal(nextProps, this.props) || !equal(nextState, this.state);
}
```

If `shouldComponentUpdate` returns false, then `render()` will be completely skipped until the next state change. (In addition, `componentWillUpdate` and `componentDidUpdate` will not be called.)

By default, `shouldComponentUpdate` always returns true to prevent subtle bugs when `state` is mutated in place, but if you are careful to always treat `state` as immutable and to read only from `props` and `state` in `render()` then you can override `shouldComponentUpdate` with an implementation that compares the old props and state to their replacements.

If performance is a bottleneck, especially with dozens or hundreds of components, use `shouldComponentUpdate` to speed up your app.


### Updating: componentWillUpdate

```javascript
componentWillUpdate(object nextProps, object nextState)
```

Invoked immediately before rendering when new props or state are being received. This method is not called for the initial render.

Use this as an opportunity to perform preparation before an update occurs.

> Note:
>
> You *cannot* use `this.setState()` in this method. If you need to update state in response to a prop change, use `componentWillReceiveProps` instead.


### Updating: componentDidUpdate

```javascript
componentDidUpdate(object prevProps, object prevState)
```

Invoked immediately after updating occurs. This method is not called for the initial render.

Use this as an opportunity to operate on the DOM when the component has been updated.

> Note:
>
> Prior to v0.6, the DOM node was passed in as the last argument. If you were using this, you can still access the DOM node by calling `this.getDOMNode()`.


### Unmounting: componentWillUnmount

```javascript
componentWillUnmount()
```

Invoked immediately before a component is unmounted from the DOM.

Perform any necessary cleanup in this method, such as invalidating timers or cleaning up any DOM elements that were created in `componentDidMount`.
