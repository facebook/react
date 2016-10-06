---
id: the-component-lifecycle
title: The Component Lifecycle
permalink: docs/the-component-lifecycle.html
prev: rendering-elements.html
---

Components have three main parts of their lifecycle:

* **[Mounting](#mounting):** A component is being inserted into the DOM.
* **[Updating](#updating):** A component is being re-rendered to determine if the DOM should be updated.
* **[Unmounting](#unmounting):** A component is being removed from the DOM.

React provides lifecycle methods that you can specify to hook into this process. Methods prefixed with **`will`** are called right before something happens, and methods prefixed with **`did`** are called right after something happens.

## Mounting

These methods are called when a component is being inserted into the DOM.

* **`getInitialState(): object`** is invoked before a component is mounted. Stateful components should implement this and return the initial state data.
* **`componentWillMount()`** is invoked immediately before mounting occurs.
* **`componentDidMount()`** is invoked immediately after mounting occurs. Initialization that requires DOM nodes should go here.

## Updating

These methods are called when a component is being re-rendered and are used to determine if the DOM should be updated.

* **`componentWillReceiveProps(object nextProps)`** is invoked when a mounted component receives new props. This method should be used to compare `this.props` and `nextProps` to perform state transitions using `this.setState()`.
* **`shouldComponentUpdate(object nextProps, object nextState): boolean`** is invoked when a component decides whether any changes warrant an update to the DOM. Implement this as an optimization to compare `this.props` with `nextProps` and `this.state` with `nextState` and return `false` if React should skip updating.
* **`componentWillUpdate(object nextProps, object nextState)`** is invoked immediately before updating occurs. You cannot call `this.setState()` here.
* **`componentDidUpdate(object prevProps, object prevState)`** is invoked immediately after updating occurs.

## Unmounting

These methods are called when a component is being removed from the DOM.

* **`componentWillUnmount()`** is invoked immediately before a component is unmounted and destroyed. Cleanup should go here.

## Mounted Methods

_Mounted_ composite components also support the following method.

*  **`mountedComponent.forceUpdate()`** can be invoked on any mounted component when you know that some deeper aspect of the component's state has changed without using `this.setState()`.
