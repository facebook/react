---
id: component-api
title: Component API
permalink: component-api.html
prev: top-level-api.html
next: component-specs.html
---

## ReactComponent

Instances of a React Component are created internally in React when rendering. These instances are reused in subsequent renders, and can be accessed in your component methods as `this`. The only way to get a handle to a React Component instance outside of React is by storing the return value of `React.render`. Inside other Components, you may use [refs](/react/docs/more-about-refs.html) to achieve the same result.


### setState

```javascript
setState(object nextState[, function callback])
```

Merges nextState with the current state. This is the primary method you use to trigger UI updates from event handlers and server request callbacks.  In addition, you can supply an optional callback function that is executed once `setState` is completed and the component is re-rendered.

> Notes:
>
> *NEVER* mutate `this.state` directly, as calling `setState()` afterwards may replace the mutation you made. Treat `this.state` as if it were immutable.
>
> `setState()` does not immediately mutate `this.state` but creates a pending state transition. Accessing `this.state` after calling this method can potentially return the existing value.
>
> There is no guarantee of synchronous operation of calls to `setState` and calls may be batched for performance gains.
>
> `setState()` will always trigger a re-render unless conditional rendering logic is implemented in `shouldComponentUpdate()`. If mutable objects are being used and the logic cannot be implemented in `shouldComponentUpdate()`, calling `setState()` only when the new state differs from the previous state will avoid unnecessary re-renders.


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


### getDOMNode

```javascript
DOMElement getDOMNode()
```

If this component has been mounted into the DOM, this returns the corresponding native browser DOM element. This method is useful for reading values out of the DOM, such as form field values and performing DOM measurements. When `render` returns `null` or `false`, `this.getDOMNode()` returns `null`.


### isMounted()

```javascript
bool isMounted()
```

`isMounted()` returns true if the component is rendered into the DOM, false otherwise. You can use this method to guard asynchronous calls to `setState()` or `forceUpdate()`.


### setProps

```javascript
setProps(object nextProps[, function callback])
```

When you're integrating with an external JavaScript application you may want to signal a change to a React component rendered with `React.render()`.

Though calling `React.render()` again on the same node is the preferred way to update a root-level component, you can also call `setProps()` to change its properties and trigger a re-render. In addition, you can supply an optional callback function that is executed once `setProps` is completed and the component is re-rendered.

> Note:
>
> When possible, the declarative approach of calling `React.render()` again is preferred; it tends to make updates easier to reason about. (There's no significant performance difference between the two approaches.)
>
> This method can only be called on a root-level component. That is, it's only available on the component passed directly to `React.render()` and none of its children. If you're inclined to use `setProps()` on a child component, instead take advantage of reactive updates and pass the new prop to the child component when it's created in `render()`.


### replaceProps

```javascript
replaceProps(object nextProps[, function callback])
```

Like `setProps()` but deletes any pre-existing props instead of merging the two objects.
