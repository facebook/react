---
id: test-utils
title: Test Utilities
permalink: docs/test-utils.html
layout: docs
category: Reference
---

**Importing**

```javascript
import ReactTestUtils from 'react-dom/test-utils'; // ES6
var ReactTestUtils = require('react-dom/test-utils'); // ES5 with npm
```

## Overview

`ReactTestUtils` makes it easy to test React components in the testing framework of your choice. At Facebook we use [Jest](https://facebook.github.io/jest/) for painless JavaScript testing. Learn how to get started with Jest through the Jest website's [React Tutorial](http://facebook.github.io/jest/docs/tutorial-react.html#content).

> Note:
>
> Airbnb has released a testing utility called Enzyme, which makes it easy to assert, manipulate, and traverse your React Components' output. If you're deciding on a unit testing utility to use together with Jest, or any other test runner, it's worth checking out: [http://airbnb.io/enzyme/](http://airbnb.io/enzyme/)

 - [`Simulate`](#simulate)
 - [`renderIntoDocument()`](#renderintodocument)
 - [`mockComponent()`](#mockcomponent)
 - [`isElement()`](#iselement)
 - [`isElementOfType()`](#iselementoftype)
 - [`isDOMComponent()`](#isdomcomponent)
 - [`isCompositeComponent()`](#iscompositecomponent)
 - [`isCompositeComponentWithType()`](#iscompositecomponentwithtype)
 - [`findAllInRenderedTree()`](#findallinrenderedtree)
 - [`scryRenderedDOMComponentsWithClass()`](#scryrendereddomcomponentswithclass)
 - [`findRenderedDOMComponentWithClass()`](#findrendereddomcomponentwithclass)
 - [`scryRenderedDOMComponentsWithTag()`](#scryrendereddomcomponentswithtag)
 - [`findRenderedDOMComponentWithTag()`](#findrendereddomcomponentwithtag)
 - [`scryRenderedComponentsWithType()`](#scryrenderedcomponentswithtype)
 - [`findRenderedComponentWithType()`](#findrenderedcomponentwithtype)

## Reference

### `Simulate`

```javascript
Simulate.{eventName}(
  element,
  [eventData]
)
```

Simulate an event dispatch on a DOM node with optional `eventData` event data.

`Simulate` has a method for [every event that React understands](/react/docs/events.html#supported-events).

**Clicking an element**

```javascript
// <button ref="button">...</button>
const node = this.refs.button;
ReactTestUtils.Simulate.click(node);
```

**Changing the value of an input field and then pressing ENTER.**

```javascript
// <input ref="input" />
const node = this.refs.input;
node.value = 'giraffe';
ReactTestUtils.Simulate.change(node);
ReactTestUtils.Simulate.keyDown(node, {key: "Enter", keyCode: 13, which: 13});
```

> Note
>
> You will have to provide any event property that you're using in your component (e.g. keyCode, which, etc...) as React is not creating any of these for you.

* * *

### `renderIntoDocument()`

```javascript
renderIntoDocument(element)
```

Render a React element into a detached DOM node in the document. **This function requires a DOM.**

> Note:
>
> You will need to have `window`, `window.document` and `window.document.createElement` globally available **before** you import `React`. Otherwise React will think it can't access the DOM and methods like `setState` won't work.

* * *

### `mockComponent()`

```javascript
mockComponent(
  componentClass,
  [mockTagName]
)
```

Pass a mocked component module to this method to augment it with useful methods that allow it to be used as a dummy React component. Instead of rendering as usual, the component will become a simple `<div>` (or other tag if `mockTagName` is provided) containing any provided children.

* * *

### `isElement()`

```javascript
isElement(element)
```

Returns `true` if `element` is any React element.

* * *

### `isElementOfType()`

```javascript
isElementOfType(
  element,
  componentClass
)
```

Returns `true` if `element` is a React element whose type is of a React `componentClass`.

* * *

### `isDOMComponent()`

```javascript
isDOMComponent(instance)
```

Returns `true` if `instance` is a DOM component (such as a `<div>` or `<span>`).

* * *

### `isCompositeComponent()`

```javascript
isCompositeComponent(instance)
```

Returns `true` if `instance` is a user-defined component, such as a class or a function.

* * *

### `isCompositeComponentWithType()`

```javascript
isCompositeComponentWithType(
  instance,
  componentClass
)
```

Returns `true` if `instance` is a component whose type is of a React `componentClass`.

* * *

### `findAllInRenderedTree()`

```javascript
findAllInRenderedTree(
  tree,
  test
)
```

Traverse all components in `tree` and accumulate all components where `test(component)` is `true`. This is not that useful on its own, but it's used as a primitive for other test utils.

* * *

### `scryRenderedDOMComponentsWithClass()`

```javascript
scryRenderedDOMComponentsWithClass(
  tree,
  className
)
```

Finds all DOM elements of components in the rendered tree that are DOM components with the class name matching `className`.

* * *

### `findRenderedDOMComponentWithClass()`

```javascript
findRenderedDOMComponentWithClass(
  tree,
  className
)
```

Like [`scryRenderedDOMComponentsWithClass()`](#scryrendereddomcomponentswithclass) but expects there to be one result, and returns that one result, or throws exception if there is any other number of matches besides one.

* * *

### `scryRenderedDOMComponentsWithTag()`

```javascript
scryRenderedDOMComponentsWithTag(
  tree,
  tagName
)
```

Finds all DOM elements of components in the rendered tree that are DOM components with the tag name matching `tagName`.

* * *

### `findRenderedDOMComponentWithTag()`

```javascript
findRenderedDOMComponentWithTag(
  tree,
  tagName
)
```

Like [`scryRenderedDOMComponentsWithTag()`](#scryrendereddomcomponentswithtag) but expects there to be one result, and returns that one result, or throws exception if there is any other number of matches besides one.

* * *

### `scryRenderedComponentsWithType()`

```javascript
scryRenderedComponentsWithType(
  tree,
  componentClass
)
```

Finds all instances of components with type equal to `componentClass`.

* * *

### `findRenderedComponentWithType()`

```javascript
findRenderedComponentWithType(
  tree,
  componentClass
)
```

Same as [`scryRenderedComponentsWithType()`](#scryrenderedcomponentswithtype) but expects there to be one result and returns that one result, or throws exception if there is any other number of matches besides one.

* * *

## Shallow Rendering

### `createRenderer()`

```javascript
createRenderer()
```

Call this in your tests to create a [shallow renderer](#shallow-rendering).

* * *

### `shallowRenderer.render()`

```javascript
shallowRenderer.render(
  element
)
```

Similar to [`ReactDOM.render`](/react/docs/react-dom.html#render) but it doesn't require DOM and only renders a single level deep. See [Shallow Rendering](#shallow-rendering).

* * *

### `shallowRenderer.getRenderOutput()`

```javascript
shallowRenderer.getRenderOutput()
```

After [`shallowRenderer.render()`](#shallowrenderer.render) has been called, returns shallowly rendered output.
