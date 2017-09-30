---
id: react-api
title: React Top-Level API
layout: docs
category: Reference
permalink: docs/react-api.html
redirect_from:
  - "docs/reference.html"
  - "docs/clone-with-props.html"
  - "docs/top-level-api.html"
  - "docs/top-level-api-ja-JP.html"
  - "docs/top-level-api-ko-KR.html"
  - "docs/top-level-api-zh-CN.html"
  - "docs/glossary.html"
---

`React` is the entry point to the React library. If you load React from a `<script>` tag, these top-level APIs are available on the `React` global. If you use ES6 with npm, you can write `import React from 'react'`. If you use ES5 with npm, you can write `var React = require('react')`.

## Overview

### Components

React components let you split the UI into independent, reusable pieces, and think about each piece in isolation. React components can be defined by subclassing `React.Component` or `React.PureComponent`.

 - [`React.Component`](#reactcomponent)
 - [`React.PureComponent`](#reactpurecomponent)

If you don't use ES6 classes, you may use the `create-react-class` module instead. See [Using React without ES6](/docs/react-without-es6.html) for more information.

### Creating React Elements

We recommend [using JSX](/docs/introducing-jsx.html) to describe what your UI should look like. Each JSX element is just syntactic sugar for calling [`React.createElement()`](#createelement). You will not typically invoke the following methods directly if you are using JSX.

- [`createElement()`](#createelement)
- [`createFactory()`](#createfactory)

See [Using React without JSX](/docs/react-without-jsx.html) for more information.

### Transforming Elements

`React` also provides some other APIs:

- [`cloneElement()`](#cloneelement)
- [`isValidElement()`](#isvalidelement)
- [`React.Children`](#reactchildren)

* * *

## Reference

### `React.Component`

`React.Component` is the base class for React components when they are defined using [ES6 classes](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Classes).

```javascript
class Greeting extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

See the [React.Component API Reference](/docs/react-component.html) for a list of methods and properties related to the base `React.Component` class.

* * *

### `React.PureComponent`

`React.PureComponent` is exactly like [`React.Component`](#reactcomponent) but implements [`shouldComponentUpdate()`](/docs/react-component.html#shouldcomponentupdate) with a shallow prop and state comparison.

If your React component's `render()` function renders the same result given the same props and state, you can use `React.PureComponent` for a performance boost in some cases.

> Note
>
> `React.PureComponent`'s `shouldComponentUpdate()` only shallowly compares the objects. If these contain complex data structures, it may produce false-negatives for deeper differences. Only extend `PureComponent` when you expect to have simple props and state, or use [`forceUpdate()`](/docs/react-component.html#forceupdate) when you know deep data structures have changed. Or, consider using [immutable objects](https://facebook.github.io/immutable-js/) to facilitate fast comparisons of nested data.
>
> Furthermore, `React.PureComponent`'s `shouldComponentUpdate()` skips prop updates for the whole component subtree. Make sure all the children components are also "pure".

* * *

### `createElement()`

```javascript
React.createElement(
  type,
  [props],
  [...children]
)
```

Create and return a new [React element](/docs/rendering-elements.html) of the given type. The type argument can be either a tag name string (such as `'div'` or `'span'`), or a [React component](/docs/components-and-props.html) type (a class or a function).

Code written with [JSX](/docs/introducing-jsx.html) will be converted to use `React.createElement()`. You will not typically invoke `React.createElement()` directly if you are using JSX. See [React Without JSX](/docs/react-without-jsx.html) to learn more.

* * *

### `cloneElement()`

```
React.cloneElement(
  element,
  [props],
  [...children]
)
```

Clone and return a new React element using `element` as the starting point. The resulting element will have the original element's props with the new props merged in shallowly. New children will replace existing children. `key` and `ref` from the original element will be preserved.

`React.cloneElement()` is almost equivalent to:

```js
<element.type {...element.props} {...props}>{children}</element.type>
```

However, it also preserves `ref`s. This means that if you get a child with a `ref` on it, you won't accidentally steal it from your ancestor. You will get the same `ref` attached to your new element.

This API was introduced as a replacement of the deprecated `React.addons.cloneWithProps()`.

* * *

### `createFactory()`

```javascript
React.createFactory(type)
```

Return a function that produces React elements of a given type. Like [`React.createElement()`](#createElement), the type argument can be either a tag name string (such as `'div'` or `'span'`), or a [React component](/docs/components-and-props.html) type (a class or a function).

This helper is considered legacy, and we encourage you to either use JSX or use `React.createElement()` directly instead.

You will not typically invoke `React.createFactory()` directly if you are using JSX. See [React Without JSX](/docs/react-without-jsx.html) to learn more.

* * *

### `isValidElement()`

```javascript
React.isValidElement(object)
```

Verifies the object is a React element. Returns `true` or `false`.

* * *

### `React.Children`

`React.Children` provides utilities for dealing with the `this.props.children` opaque data structure.

#### `React.Children.map`

```javascript
React.Children.map(children, function[(thisArg)])
```

Invokes a function on every immediate child contained within `children` with `this` set to `thisArg`. If `children` is a keyed fragment or array it will be traversed: the function will never be passed the container objects. If children is `null` or `undefined`, returns `null` or `undefined` rather than an array.

#### `React.Children.forEach`

```javascript
React.Children.forEach(children, function[(thisArg)])
```

Like [`React.Children.map()`](#reactchildrenmap) but does not return an array.

#### `React.Children.count`

```javascript
React.Children.count(children)
```

Returns the total number of components in `children`, equal to the number of times that a callback passed to `map` or `forEach` would be invoked.

#### `React.Children.only`

```javascript
React.Children.only(children)
```

Returns the only child in `children`. Throws otherwise.

#### `React.Children.toArray`

```javascript
React.Children.toArray(children)
```

Returns the `children` opaque data structure as a flat array with keys assigned to each child. Useful if you want to manipulate collections of children in your render methods, especially if you want to reorder or slice `this.props.children` before passing it down.

> Note:
>
> `React.Children.toArray()` changes keys to preserve the semantics of nested arrays when flattening lists of children. That is, `toArray` prefixes each key in the returned array so that each element's key is scoped to the input array containing it.
