---
id: reference-react
title: React Top-Level API
permalink: docs/reference-react.html
next: reference-react-dom.html
redirect_from: "/docs/reference.html"
---

`React` is the entry point to the React library. If you're using one of the prebuilt packages it's available as a global; if you're using CommonJS modules you can `require()` it.

## Reference

 - [`React.Component`](#react.component)
 - [`createClass()`](#createclass)
 - [`createElement()`](#createlement)
 - [`cloneElement()`](#cloneelement)
 - [`createFactory()`](#createfactory)
 - [`isValidElement()`](#isvalidelement)
 - [`PropTypes`](#proptypes)
 - [`Children`](#children)

### `React.Component`

```javascript
class Greeting extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

`React.Component` is the base class for React components when they are defined using ES6 classes. See the [React.Component API Reference](/react/docs/reference-react-component.html) for a list of methods related to the base `React.Component` class.

### `createClass()`

```javascript
React.createClass(specification)
```

If you don't use ES6 yet, you may use the `React.createClass` helper instead to create a component class. See [Using React without ES6](/react/docs/react-without-es6.html) for more information.

### `createElement()`

```javascript
React.createElement(
  type,
  [props],
  [...children]
)
```

Create and return a new React element of the given type. The type argument can be either an
html tag name string (eg. 'div', 'span', etc), or a React class (created via `React.createClass`).

Code written with JSX will be converted to use `React.createElement`. You will not typically invoke `React.createElement` directly if you are using JSX. See [React Without JSX](/react/docs/react-without-jsx.html) to learn more.

Convenience wrappers around `React.createElement` for DOM components are provided by `React.DOM`. For example, `React.DOM.a(...)` is a convenience wrapper for `React.createElement('a', ...)`.

### `cloneElement()`

```
React.cloneElement(
  element,
  [props],
  [...children]
)
```

Clone and return a new React element using `element` as the starting point. The resulting element will have the original element's props with the new props merged in shallowly. New children will replace existing children. `key` and `ref` from the original element will be preserved.

`React.cloneElement` is almost equivalent to:

```js
<element.type {...element.props} {...props}>{children}</element.type>
```

However, it also preserves `ref`s. This means that if you get a child with a `ref` on it, you won't accidentally steal it from your ancestor. You will get the same `ref` attached to your new element.

This API was introduced as a replacement of the deprecated `React.addons.cloneWithProps`.

### `createFactory()`

```javascript
React.createFactory(type)
```

Return a function that produces React elements of a given type. Like [`React.createElement`](#createElement), the type argument can be either an html tag name string (eg. 'div', 'span', etc), or a React class.

You will not typically invoke `React.createFactory` directly if you are using JSX. See [React Without JSX](/react/docs/react-without-jsx.html) to learn more.

### `isValidElement()`

```javascript
React.isValidElement(object)
```

Verifies the object is a React element. Returns `true` or `false`.

### `PropTypes`

`React.PropTypes` includes types that can be used with a component's `propTypes` object to validate props being passed to your components. For more information about `propTypes`, see [Typechecking with PropTypes](/react/docs/typechecking-with-proptypes.html).

### `Children`

`React.Children` provides utilities for dealing with the `this.props.children` opaque data structure.

#### `Children.map`

```javascript
React.Children.map(children, function[(thisArg)])
```

Invoke a function on every immediate child contained within `children` with `this` set to `thisArg`. If `children` is a keyed fragment or array it will be traversed: the function will never be passed the container objects. If children is `null` or `undefined`, returns `null` or `undefined` rather than an array.

#### `Children.forEach`

```javascript
React.Children.forEach(children, function[(thisArg)])
```

Like `React.Children.map()` but does not return an array.

#### `Children.count`

```javascript
Children.count(children)
```

Return the total number of components in `children`, equal to the number of times that a callback passed to `map` or `forEach` would be invoked.

#### `Children.only`

```javascript
React.Children.only(children)
```

Return the only child in `children`. Throws otherwise.

#### `Children.toArray`

```javascript
React.Children.toArray(children)
```

Return the `children` opaque data structure as a flat array with keys assigned to each child. Useful if you want to manipulate collections of children in your render methods, especially if you want to reorder or slice `this.props.children` before passing it down.

> Note:
>
> `React.Children.toArray()` changes keys to preserve the semantics of nested arrays when flattening lists of children. That is, `toArray` prefixes each key in the returned array so that each element's key is scoped to the input array containing it.
