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

## The Render Method

When a component is being mounted or updated, React will look for a `render()` method to obtain the markup necessary to render the component. At this point, state and props are taken into account in order to render the correct output.

One important thing to note is that `render()` should be a pure function, meaning that it does not modify component state, it returns the same result each time it's invoked. The `render()` function should not read from or write to the DOM or otherwise interact with the browser (e.g., by using `setTimeout`).

If you need to update the state, or if you need to interact with the browser, perform your work in `componentWillMount()`, `componentDidMount()`, or the other lifecycle methods covered below. Keeping `render()` pure makes server rendering more practical and makes components easier to think about.

## Mounting

React will call `componentWillMount()` and `componentDidMount()` when a component is being inserted into the DOM.

### Before mounting

```js
componentWillMount()
```

`componentWillMount` is invoked immediately before mounting occurs. It is called before `render()`, therefore setting state in this method will not trigger a re-rendering.

This is the only lifecycle hook called on server rendering.

### After mounting

```js
componentDidMount()
```

`componentDidMount` is invoked immediately after a component is mounted. Initialization that requires DOM nodes should go here. If you need to load data from a remote endpoint, this is a good place to instantiate the network request. Setting state in this method will trigger a re-rendering.

Take for example the following `CommentBox` component that loads comments from a remote endpoint at `this.props.url`:

```js{7-11}
class CommentBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {data: []};
  }

  componentDidMount() {
    this.serverRequest = $.get(this.props.url, (result) => {
      this.setState({data: result});
    });
  }

  // ...
}
```

Here, `componentDidMount` is called automatically by React after `CommentBox` is rendered for the first time. The key to dynamic updates is the call to `this.setState()`. We replace the old array of comments with the new one from the server and the UI automatically updates itself. Because of this reactivity, it is only a minor change to add live updates. We will use simple polling here but you could easily use WebSockets or other technologies.

## Updating

State changes can lead to the component being re-rendered. The following methods will be called and are used to determine if the DOM should be updated.

### Before updating

```js
componentWillUpdate(nextProps, nextState)
```

`componentWillUpdate` is invoked immediately before rendering when new props or state are being received. Use this as an opportunity to perform preparation before an update occurs. This method is not called for the initial render.

Note that you cannot call `this.setState()` here. If you need to update state in response to a prop change, use `componentWillReceiveProps` instead.

### After updating

```js
componentDidUpdate(prevProps, prevState)
```

`componentDidUpdate` is invoked immediately after updating occurs. This method is not called for the initial render.

Use this as an opportunity to operate on the DOM when the component has been updated.

### Before new props are received

```js
componentWillReceiveProps(nextProps)
```

`componentWillReceiveProps` is invoked before a mounted component receives new props. If you need to update the state in response to prop changes (for example, to reset it), you may compare `this.props` and `nextProps` and perform state transitions using `this.setState()` in this method.

Note that React may call this method even if the props have not changed, so make sure to compare the current and next values if you only want to handle changes.

### Forcing an update

```js
component.forceUpdate()
```

`forceUpdate` can be invoked on any mounted component when you know that some deeper aspect of the component's state has changed without using `this.setState()`.

### Hinting if a component needs updating

Additionally, you may let React know if a component's output is not affected by the current change in state or props. The default behavior is to re-render on every state change, and in the vast majority of cases you should rely on the default behavior.

```js
shouldComponentUpdate(nextProps, nextState)
```

`shouldComponentUpdate` is invoked before rendering when new props or state are being received. Defaults to `true`. This method is not called for the initial render or when `forceUpdate` is used.

If you determine a specific component is slow after profiling, you may change it to inherit from `React.PureComponent` which implements `shouldComponentUpdate()` with a shallow prop and state comparison. If you are confident you want to write it by hand, you may compare `this.props` with `nextProps` and `this.state` with `nextState` and return `false` to tell React the update can be skipped.

Returning `false` does not prevent child components from re-rendering when *their* state changes.

Note that React treats `shouldComponentUpdate()` as a hint rather than a strict directive, and may update your component anyway.


## Unmounting

```js
componentWillUnmount(nextProps)
```

`componentWillUnmount` is invoked immediately before a component is unmounted and destroyed. Perform any necessary cleanup in this method, such as invalidating timers, canceling network requests, or cleaning up any DOM elements that were created in `componentDidMount`.

### Cleaning up

When fetching data asynchronously, use `componentWillUnmount` to cancel any outstanding requests before the component is unmounted.

Going back to our `CommentBox` example, you may recall that we're loading comments from a remote endpoint on `componentDidMount`. We can cancel the network request before the component is unmounted by calling `abort()` on it in `componentWillUnmount`:

```js{4-6}
class CommentBox extends React.Component {
  // ...

  componentWillUnmount() {
    this.serverRequest.abort();
  }

  // ...
}
```

## Legacy methods

We recommend you define your component as a plain JavaScript class that extends `React.Component`. If you don't use ES6 yet, there are some additional lifecycle methods that you can use:

* `setDefaultProps()`
* `getInitialState()`

Take a look at ["ES6 Classes and React.createClass()"](/react/docs/reusable-components.html#es6-classes-and-react.createclass) to learn how to set default props and define the initial state when using ES6.

### Setting default props

With `React.createClass()`, you need to define `propTypes` as a property on the passed object, and `getDefaultProps()` as a function on it:

```js{2-4,6-10}
var Greeting = React.createClass({
  propTypes: {
    name: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      name: 'Mary'
    };
  },

  // ...

});
```

`getDefaultProps()` is invoked once and cached when the class is created. Values in the mapping will be set on `this.props` if that prop is not specified by the parent component (i.e. using an in check).

This method is invoked before any instances are created and thus cannot rely on `this.props`. In addition, be aware that any complex objects returned by `getDefaultProps()` will be shared across instances, not copied.

With functions and ES6 classes, propTypes and defaultProps are defined as [properties on the components themselves](/react/docs/reusable-components.html#declaring-prop-types-and-default-props).

### Setting the initial state

If you're writing a stateful component using `React.createClass()`, you can use legacy `getInitialState()` lifecycle method to provide the initial state for your stateful component before it is mounted.

```js{2-4}
var Counter = React.createClass({
  getInitialState: function() {
    return {count: this.props.initialCount};
  },
  // ...
});
```

If you use ES6, you can [define the initial state in the constructor](/react/docs/reusable-components.html#setting-the-initial-state).


* * *

> Editor's Note, please remove
>
> There are many places where this is documented!
>
> Reference: https://facebook.github.io/react/docs/component-specs.html
> Old guide:  https://facebook.github.io/react/docs/working-with-the-browser.html
> Tips: https://facebook.github.io/react/tips/initial-ajax.html
