---
id: component-api
title: Component API
layout: docs
permalink: component-api.html
prev: top-level-api.html
next: component-specs.html
---

## ReactComponent

Component classes created by `createClass()` return instances of `ReactComponent` when called. Most of the time when you're using React you're either creating or consuming these component objects.


### getDOMNode

```javascript
DOMElement getDOMNode()
```

If this component has been mounted into the DOM, this returns the corresponding native browser DOM element. This method is useful for reading values out of the DOM, such as form field values and performing DOM measurements.


### setProps

```javascript
setProps(object nextProps)
```

When you're integrating with an external JavaScript application you may want to signal a change to a React component rendered with `renderComponent()`. Simply call `setProps()` to change its properties and trigger a re-render.

> Note:
>
> This method can only be called on a root-level component. That is, it's only available on the component passed directly to `renderComponent()` and none of its children. If you're inclined to use `setProps()` on a child component, instead take advantage of reactive updates and pass the new prop to the child component when it's created in `render()`.


### replaceProps

```javascript
replaceProps(object nextProps)
```

Like `setProps()` but deletes any pre-existing props instead of merging the two objects.


### transferPropsTo

```javascript
ReactComponent transferPropsTo(ReactComponent targetComponent)
```

Transfer properties from this component to a target component that have not already been set on the target component. After the props are updated, `targetComponent` is returned as a convenience. This function is useful when creating simple HTML-like components:

```javascript
var Avatar = React.createClass({
  render: function() {
    return this.transferPropsTo(
      <img src={"/avatars/" + this.props.userId + ".png"} userId={null} />
    );
  }
});

// <Avatar userId={17} width={200} height={200} />
```

Properties that are specified directly on the target component instance (such as `src` and `userId` in the above example) will not be overwritten by `transferPropsTo`.

> Note:
>
> Use `transferPropsTo` with caution; it encourages tight coupling and makes it easy to accidentally introduce implicit dependencies between components. When in doubt, it's safer to explicitly copy the properties that you need onto the child component.


### setState

```javascript
setState(object nextState[, function callback])
```

Merges nextState with the current state. This is the primary method you use to trigger UI updates from event handlers and server request callbacks.  In addition, you can supply an optional callback function that is executed once `setState` is completed.

> Notes:
>
> *NEVER* mutate `this.state` directly, as calling `setState()` afterwards may replace the mutation you made. Treat `this.state` as if it were immutable.
>
> `setState()` does not immediately mutate `this.state` but creates a pending state transition. Accessing `this.state` after calling this method can potentially return the existing value.
>
> There is no guarantee of synchronous operation of calls to `setState` and calls may be batched for performance gains.


### replaceState

```javascript
replaceState(object nextState[, function callback])
```

Like `setState()` but deletes any pre-existing state keys that are not in nextState.


### forceUpdate()

```javascript
forceUpdate([function callback])
```

If your `render()` method reads from something other than `this.props` or `this.state`, you'll need to tell React when it needs to re-run `render()` by calling `forceUpdate()`. You'll also need to call `forceUpdate()` if you mutate `this.state` directly.

Calling `forceUpdate()` will cause `render()` to be called on the component and its children, but React will still only update the DOM if the markup changes.

Normally you should try to avoid all uses of `forceUpdate()` and only read from `this.props` and `this.state` in `render()`. This makes your application much simpler and more efficient.


### isMounted()

```javascript
bool isMounted()
```

`isMounted()` returns true if the component is rendered into the DOM, false otherwise. You can use this method to guard asynchronous calls to `setState()` or `forceUpdate()`.
