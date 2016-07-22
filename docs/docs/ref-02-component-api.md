---
id: component-api
title: Component API
permalink: docs/component-api.html
prev: top-level-api.html
next: component-specs.html
---

## React.Component

Instances of a React Component are created internally in React when rendering. These instances are reused in subsequent renders, and can be accessed in your component methods as `this`. The only way to get a handle to a React Component instance outside of React is by storing the return value of `ReactDOM.render`. Inside other Components, you may use [refs](/react/docs/more-about-refs.html) to achieve the same result.


### setState

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
setState({mykey: 'my new value'});
```

It's also possible to pass a function with the signature `function(state, props)`. This can be useful in some cases when you want to enqueue an atomic update that consults the previous value of state+props before setting any values.  For instance, suppose we wanted to increment a value in state:

```javascript
setState(function(previousState, currentProps) {
  return {myInteger: previousState.myInteger + 1};
});
```

The second (optional) parameter is a callback function that will be executed once `setState` is completed and the component is re-rendered.

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
void replaceState(
  object nextState,
  [function callback]
)
```

Like `setState()` but deletes any pre-existing state keys that are not in nextState.

> Note:
>
> This method is not available on ES6 `class` components that extend `React.Component`. It may be removed entirely in a future version of React.


### forceUpdate

```javascript
void forceUpdate(
  [function callback]
)
```

By default, when your component's state or props change, your component will re-render. However, if these change implicitly (eg: data deep within an object changes without changing the object itself) or if your `render()` method depends on some other data, you can tell React that it needs to re-run `render()` by calling `forceUpdate()`.

Calling `forceUpdate()` will cause `render()` to be called on the component, skipping `shouldComponentUpdate()`. This will trigger the normal lifecycle methods for child components, including the `shouldComponentUpdate()` method of each child. React will still only update the DOM if the markup changes.

Normally you should try to avoid all uses of `forceUpdate()` and only read from `this.props` and `this.state` in `render()`. This makes your component "pure" and your application much simpler and more efficient.


### isMounted

```javascript
boolean isMounted()
```

`isMounted()` returns `true` if the component is rendered into the DOM, `false` otherwise. You can use this method to guard asynchronous calls to `setState()` or `forceUpdate()`.

> Note:
>
> This method is not available on ES6 `class` components that extend `React.Component`. It will likely be removed entirely in a future version of React, so you might as well [start migrating away from isMounted() now](/react/blog/2015/12/16/ismounted-antipattern.html).
