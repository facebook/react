---
id: working-with-the-browser
title: Working With the Browser
permalink: working-with-the-browser.html
prev: forms.html
next: more-about-refs.html
---

React provides powerful abstractions that free you from touching the DOM directly in most cases, but sometimes you simply need to access the underlying API, perhaps to work with a third-party library or existing code.

## The Virtual DOM

React is very fast because it never talks to the DOM directly. React maintains a fast in-memory representation of the DOM. `render()` methods actually return a *description* of the DOM, and React can compare this description with the in-memory representation to compute the fastest way to update the browser.

Additionally, React implements a full synthetic event system such that all event objects are guaranteed to conform to the W3C spec despite browser quirks, and everything bubbles consistently and efficiently across browsers. You can even use some HTML5 events in older browsers that don't ordinarily support them!

Most of the time you should stay within React's "faked browser" world since it's more performant and easier to reason about. However, sometimes you simply need to access the underlying API, perhaps to work with a third-party library like a jQuery plugin. React provides escape hatches for you to use the underlying DOM API directly.

## Refs and findDOMNode()

To interact with the browser, you'll need a reference to a DOM node. You can attach a `ref` to any element, which allows you to reference the **backing instance** of the component.  This is useful if you need to invoke imperative functions on the component, or want to access the underlying DOM nodes.  To learn more about refs, including ways to use them effectively, see our [refs to components](/react/docs/more-about-refs.html) documentation.

## Component Lifecycle

Components have three main parts of their lifecycle:

* **Mounting:** A component is being inserted into the DOM.
* **Updating:** A component is being re-rendered to determine if the DOM should be updated.
* **Unmounting:** A component is being removed from the DOM.

React provides lifecycle methods that you can specify to hook into this process. We provide **will** methods, which are called right before something happens, and **did** methods which are called right after something happens.

### Mounting

* `getInitialState(): object` is invoked before a component is mounted. Stateful components should implement this and return the initial state data.
* `componentWillMount()` is invoked immediately before mounting occurs.
* `componentDidMount()` is invoked immediately after mounting occurs. Initialization that requires DOM nodes should go here.

### Updating

* `componentWillReceiveProps(object nextProps)` is invoked when a mounted component receives new props. This method should be used to compare `this.props` and `nextProps` to perform state transitions using `this.setState()`.
* `shouldComponentUpdate(object nextProps, object nextState): boolean` is invoked when a component decides whether any changes warrant an update to the DOM. Implement this as an optimization to compare `this.props` with `nextProps` and `this.state` with `nextState` and return `false` if React should skip updating.
* `componentWillUpdate(object nextProps, object nextState)` is invoked immediately before updating occurs. You cannot call `this.setState()` here.
* `componentDidUpdate(object prevProps, object prevState)` is invoked immediately after updating occurs.

### Unmounting

* `componentWillUnmount()` is invoked immediately before a component is unmounted and destroyed. Cleanup should go here.

### Mounted Methods

_Mounted_ composite components also support the following method:

* `component.forceUpdate()` can be invoked on any mounted component when you know that some deeper aspect of the component's state has changed without using `this.setState()`.

## Browser Support

React supports most popular browsers, including Internet Explorer 9 and above.

(We don't support older browsers that don't support ES5 methods, but you may find that your apps do work in older browsers if polyfills such as [es5-shim and es5-sham](https://github.com/es-shims/es5-shim) are included in the page. You're on your own if you choose to take this path.)
