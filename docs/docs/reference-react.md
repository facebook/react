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

`React` is the entry point to the React library. If you use React as a script tag, these top-level APIs are available on the `React` global. If you use ES6 with npm, you can write `import React from 'react'`. If you use ES5 with npm, you can write `var React = require('react')`.

## Overview

### Components

React components let you split the UI into independent, reusable pieces, and think about each piece in isolation. React components can be defined by subclassing `React.Component` or `React.PureComponent`.

 - [`React.Component`](#react.component)
 - [`React.PureComponent`](#react.purecomponent)

If you don't use ES6 classes, you may use this helper instead.

 - [`createClass()`](#createclass)

### Creating React Elements

We recommend [using JSX](/react/docs/introducing-jsx.html) to describe what your UI should look like. Each JSX element is just syntactic sugar for calling [`React.createElement()`](#createelement). You will not typically invoke the following methods directly if you are using JSX.

- [`createElement()`](#createelement)
- [`createFactory()`](#createfactory)

See [Using React without JSX](/react/docs/react-without-jsx.html) for more information.

### Transforming Elements

`React` also provides some other APIs:

- [`cloneElement()`](#cloneelement)
- [`isValidElement()`](#isvalidelement)
- [`React.Children`](#react.children)

### Typechecking with PropTypes

You can use `React.PropTypes` to run typechecking on the props for a component.

 - [`React.PropTypes`](#react.proptypes)
 - [`React.PropTypes.array`](#react.proptypes.array)
 - [`React.PropTypes.bool`](#react.proptypes.bool)
 - [`React.PropTypes.func`](#react.proptypes.func)
 - [`React.PropTypes.number`](#react.proptypes.number)
 - [`React.PropTypes.object`](#react.proptypes.object)
 - [`React.PropTypes.string`](#react.proptypes.string)
 - [`React.PropTypes.symbol`](#react.proptypes.symbol)
 - [`React.PropTypes.node`](#react.proptypes.node)
 - [`React.PropTypes.element`](#react.proptypes.element)
 - [`React.PropTypes.instanceOf()`](#react.proptypes.instanceof)
 - [`React.PropTypes.oneOf()`](#react.proptypes.oneof)
 - [`React.PropTypes.oneOfType()`](#react.proptypes.oneoftype)
 - [`React.PropTypes.arrayOf()`](#react.proptypes.arrayof)
 - [`React.PropTypes.objectOf()`](#react.proptypes.objectof)
 - [`React.PropTypes.shape()`](#react.proptypes.shape)
 - [`React.PropTypes.any`](#react.proptypes.any)

Validators treat props as optional by default. You can use `isRequired` to make sure a warning is shown if the prop is not provided.

 - [`isRequired`](#isrequired)

### Add-Ons

If you're using [`react-with-addons.js`](/react/docs/addons.html), the React Add-Ons will be available via `React.addons`.

 - [`React.addons`](#react.addons)

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

See the [React.Component API Reference](/react/docs/react-component.html) for a list of methods and properties related to the base `React.Component` class.

* * *

### `React.PureComponent`

`React.PureComponent` is exactly like [`React.Component`](#react.component) but implements [`shouldComponentUpdate()`](/react/docs/react-component.html#shouldcomponentupdate) with a shallow prop and state comparison.

If your React component's `render()` function renders the same result given the same props and state, you can use `React.PureComponent` for a performance boost in some cases.

> Note

> `React.PureComponent`'s `shouldComponentUpdate()` only shallowly compares the objects. If these contain complex data structures, it may produce false-negatives for deeper differences. Only mix into components which have simple props and state, or use [`forceUpdate()`](/react/docs/react-component.html#forceupdate) when you know deep data structures have changed. Or, consider using [immutable objects](https://facebook.github.io/immutable-js/) to facilitate fast comparisons of nested data.
>
> Furthermore, `React.PureComponent`'s `shouldComponentUpdate()` skips prop updates for the whole component subtree. Make sure all the children components are also "pure".

* * *

### `createClass()`

```javascript
React.createClass(specification)
```

If you don't use ES6 yet, you may use the `React.createClass()` helper instead to create a component class.

```javascript
var Greeting = React.createClass({
  render: function() {
    return <h1>Hello, {this.props.name}</h1>;
  }
});
```

See [Using React without ES6](/react/docs/react-without-es6.html) for more information.

* * *

### `createElement()`

```javascript
React.createElement(
  type,
  [props],
  [...children]
)
```

Create and return a new [React element](/react/docs/rendering-elements.html) of the given type. The type argument can be either a tag name string (such as `'div'` or `'span'`), or a [React component](/react/docs/components-and-props.html) type (a class or a function).

Convenience wrappers around `React.createElement()` for DOM components are provided by `React.DOM`. For example, `React.DOM.a(...)` is a convenience wrapper for `React.createElement('a', ...)`. They are considered legacy, and we encourage you to either use JSX or use `React.createElement()` directly instead.

Code written with [JSX](/react/docs/introducing-jsx.html) will be converted to use `React.createElement()`. You will not typically invoke `React.createElement()` directly if you are using JSX. See [React Without JSX](/react/docs/react-without-jsx.html) to learn more.

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

Return a function that produces React elements of a given type. Like [`React.createElement()`](#createElement), the type argument can be either a tag name string (such as `'div'` or `'span'`), or a [React component](/react/docs/components-and-props.html) type (a class or a function).

This helper is considered legacy, and we encourage you to either use JSX or use `React.createElement()` directly instead.

You will not typically invoke `React.createFactory()` directly if you are using JSX. See [React Without JSX](/react/docs/react-without-jsx.html) to learn more.

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

Like [`React.Children.map()`](#react.children.map) but does not return an array.

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

* * *

### `React.PropTypes`

`React.PropTypes` exports a range of validators that can be used with a component's `propTypes` object to validate props being passed to your components.

For more information about `PropTypes`, see [Typechecking with PropTypes](/react/docs/typechecking-with-proptypes.html).

#### `React.PropTypes.array`

```javascript
React.PropTypes.array
```

Validates that a prop is a JavaScript array primitive.

#### `React.PropTypes.bool`

```javascript
React.PropTypes.bool
```

Validates that a prop is a JavaScript bool primitive.

#### `React.PropTypes.func`

```javascript
React.PropTypes.func
```

Validates that a prop is a JavaScript function.

#### `React.PropTypes.number`

```javascript
React.PropTypes.number
```

Validates that a prop is a JavaScript number primitive.

#### `React.PropTypes.object`

```javascript
React.PropTypes.object
```

Validates that a prop is a JavaScript object.

#### `React.PropTypes.string`

```javascript
React.PropTypes.string
```

Validates that a prop is a JavaScript string primitive.

#### `React.PropTypes.symbol`

```javascript
React.PropTypes.symbol
```

Validates that a prop is a JavaScript symbol.

#### `React.PropTypes.node`

```javascript
React.PropTypes.node
```

Validates that a prop is anything that can be rendered: numbers, strings, elements or an array (or fragment) containing these types.

#### `React.PropTypes.element`

```javascript
React.PropTypes.element
```

Validates that a prop is a React element.

#### `React.PropTypes.instanceOf()`

```javascript
React.PropTypes.instanceOf(class)
```

Validates that a prop is an instance of a class. This uses JavaScript's `instanceof` operator.

#### `React.PropTypes.oneOf()`

```javascript
React.PropTypes.oneOf(arrayOfValues)
```

Validates that a prop is limited to specific values by treating it as an enum.

```javascript
MyComponent.propTypes = {
  optionalEnum: React.PropTypes.oneOf(['News', 'Photos']),
}
```

#### `React.PropTypes.oneOfType()`

```javascript
React.PropTypes.oneOfType(arrayOfPropTypes)
```

Validates that a prop is an object that could be one of many types.

```javascript
MyComponent.propTypes = {
  optionalUnion: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
    React.PropTypes.instanceOf(Message)
  ]),
}
```

#### `React.PropTypes.arrayOf()`

```javascript
React.PropTypes.arrayOf(propType)
```

Validates that a prop is an an array of a certain type.

```javascript
MyComponent.propTypes = {
  optionalArrayOf: React.PropTypes.arrayOf(React.PropTypes.number),
}
```

#### `React.PropTypes.objectOf()`

```javascript
React.PropTypes.objectOf(propType)
```

Validates that a prop is an object with property values of a certain type.

```javascript
MyComponent.propTypes = {
  optionalObjectOf: React.PropTypes.objectOf(React.PropTypes.number),
}
```

#### `React.PropTypes.shape()`

```javascript
React.PropTypes.shape(object)
```

Validates that a prop is an object taking on a particular shape.

```javascript
MyComponent.propTypes = {
  optionalObjectWithShape: React.PropTypes.shape({
    color: React.PropTypes.string,
    fontSize: React.PropTypes.number
  }),
}
```

#### `React.PropTypes.any`

```javascript
React.PropTypes.any
```

Validates that a prop has a value of any data type. Usually followed by `isRequired`.

```javascript
MyComponent.propTypes = {
  requiredAny: React.PropTypes.any.isRequired,
}
```

### `isRequired`

```javascript
propType.isRequired
```

You can chain any of the above validators with `isRequired` to make sure a warning is shown if the prop is not provided.

```javascript
MyComponent.propTypes = {
  requiredFunc: React.PropTypes.func.isRequired,
}
```

* * *

### `React.addons`

```javascript
React.addons
```

`React.addons` exports a range of add-ons when using [`react-with-addons.js`](/react/docs/addons.html).
