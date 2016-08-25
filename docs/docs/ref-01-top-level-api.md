---
id: top-level-api
title: Top-Level API
permalink: docs/top-level-api.html
next: component-api.html
redirect_from: "/docs/reference.html"
---

## React

`React` is the entry point to the React library. If you're using one of the prebuilt packages it's available as a global; if you're using CommonJS modules you can `require()` it.


### React.Component

```javascript
class Component
```

This is the base class for React Components when they're defined using ES6 classes. See [Reusable Components](/react/docs/reusable-components.html#es6-classes) for how to use ES6 classes with React. For what methods are actually provided by the base class, see the [Component API](/react/docs/component-api.html).


### React.createClass

```javascript
ReactClass createClass(object specification)
```

Create a component class, given a specification. A component implements a `render` method which returns **one single** child. That child may have an arbitrarily deep child structure. One thing that makes components different than standard prototypal classes is that you don't need to call new on them. They are convenience wrappers that construct backing instances (via new) for you.

For more information about the specification object, see [Component Specs and Lifecycle](/react/docs/component-specs.html).


### React.createElement

```javascript
ReactElement createElement(
  string/ReactClass type,
  [object props],
  [children ...]
)
```

Create and return a new `ReactElement` of the given type. The type argument can be either an
html tag name string (eg. 'div', 'span', etc), or a `ReactClass` (created via `React.createClass`).


### React.cloneElement

```
ReactElement cloneElement(
  ReactElement element,
  [object props],
  [children ...]
)
```

Clone and return a new `ReactElement` using `element` as the starting point. The resulting element will have the original element's props with the new props merged in shallowly. New children will replace existing children. Unlike `React.addons.cloneWithProps`, `key` and `ref` from the original element will be preserved. There is no special behavior for merging any props (unlike `cloneWithProps`). See the [v0.13 RC2 blog post](/react/blog/2015/03/03/react-v0.13-rc2.html) for additional details.


### React.createFactory

```javascript
factoryFunction createFactory(
  string/ReactClass type
)
```

Return a function that produces ReactElements of a given type. Like `React.createElement`, the type argument can be either an html tag name string (eg. 'div', 'span', etc), or a `ReactClass`.


### React.isValidElement

```javascript
boolean isValidElement(* object)
```

Verifies the object is a ReactElement.


### React.DOM

`React.DOM` provides convenience wrappers around `React.createElement` for DOM components. These should only be used when not using JSX. For example, `React.DOM.div(null, 'Hello World!')`


### React.PropTypes

`React.PropTypes` includes types that can be used with a component's `propTypes` object to validate props being passed to your components. For more information about `propTypes`, see [Reusable Components](/react/docs/reusable-components.html).


### React.Children

`React.Children` provides utilities for dealing with the `this.props.children` opaque data structure.

#### React.Children.map

```javascript
array React.Children.map(object children, function fn [, object thisArg])
```

Invoke `fn` on every immediate child contained within `children` with `this` set to `thisArg`. If `children` is a [keyed fragment](/react/docs/create-fragment.html) or array it will be traversed: `fn` will never be passed the container objects. If children is `null` or `undefined` returns `null` or `undefined` rather than an array.

#### React.Children.forEach

```javascript
React.Children.forEach(object children, function fn [, object thisArg])
```

Like `React.Children.map()` but does not return an array.

#### React.Children.count

```javascript
number React.Children.count(object children)
```

Return the total number of components in `children`, equal to the number of times that a callback passed to `map` or `forEach` would be invoked.

#### React.Children.only

```javascript
object React.Children.only(object children)
```

Return the only child in `children`. Throws otherwise.

#### React.Children.toArray

```javascript
array React.Children.toArray(object children)
```

Return the `children` opaque data structure as a flat array with keys assigned to each child. Useful if you want to manipulate collections of children in your render methods, especially if you want to reorder or slice `this.props.children` before passing it down.

> Note:
> 
> `React.Children.toArray()` changes keys to preserve the semantics of nested arrays when flattening lists of children. That is, `toArray` prefixes each key in the returned array so that each element's key is scoped to the input array containing it.

## ReactDOM

The `react-dom` package provides DOM-specific methods that can be used at the top level of your app and as an escape hatch to get outside of the React model if you need to. Most of your components should not need to use this module.

### ReactDOM.render

```javascript
render(
  ReactElement element,
  DOMElement container,
  [function callback]
)
```

Render a ReactElement into the DOM in the supplied `container` and return a [reference](/react/docs/more-about-refs.html) to the component (or returns `null` for [stateless components](/react/docs/reusable-components.html#stateless-functions)).

If the ReactElement was previously rendered into `container`, this will perform an update on it and only mutate the DOM as necessary to reflect the latest React component.

If the optional callback is provided, it will be executed after the component is rendered or updated.

> Note:
>
> `ReactDOM.render()` controls the contents of the container node you pass in. Any existing DOM elements
> inside are replaced when first called. Later calls use React’s DOM diffing algorithm for efficient
> updates.
>
> `ReactDOM.render()` does not modify the container node (only modifies the children of the container). In
> the future, it may be possible to insert a component to an existing DOM node without overwriting
> the existing children.
>
> `ReactDOM.render()` currently returns a reference to the root `ReactComponent` instance. However, using this return value is legacy
> and should be avoided because future versions of React may render components asynchronously in some cases. If you need a reference to the root `ReactComponent` instance, the preferred solution is to attach a
> [callback ref](/react/docs/more-about-refs.html#the-ref-callback-attribute) to the root element.


### ReactDOM.unmountComponentAtNode

```javascript
boolean unmountComponentAtNode(DOMElement container)
```

Remove a mounted React component from the DOM and clean up its event handlers and state. If no component was mounted in the container, calling this function does nothing. Returns `true` if a component was unmounted and `false` if there was no component to unmount.


### ReactDOM.findDOMNode

```javascript
DOMElement findDOMNode(ReactComponent component)
```
If this component has been mounted into the DOM, this returns the corresponding native browser DOM element. This method is useful for reading values out of the DOM, such as form field values and performing DOM measurements. **In most cases, you can attach a ref to the DOM node and avoid using `findDOMNode` at all.** When `render` returns `null` or `false`, `findDOMNode` returns `null`.

> Note:
>
> `findDOMNode()` is an escape hatch used to access the underlying DOM node. In most cases, use of this escape hatch is discouraged because it pierces the component abstraction.
>
> `findDOMNode()` only works on mounted components (that is, components that have been placed in the DOM). If you try to call this on a component that has not been mounted yet (like calling `findDOMNode()` in `render()` on a component that has yet to be created) an exception will be thrown.
>
> `findDOMNode()` cannot be used on stateless components.

## ReactDOMServer

The `react-dom/server` package allows you to render your components on the server.

### ReactDOMServer.renderToString

```javascript
string renderToString(ReactElement element)
```

Render a ReactElement to its initial HTML. This should only be used on the server. React will return an HTML string. You can use this method to generate HTML on the server and send the markup down on the initial request for faster page loads and to allow search engines to crawl your pages for SEO purposes.

If you call `ReactDOM.render()` on a node that already has this server-rendered markup, React will preserve it and only attach event handlers, allowing you to have a very performant first-load experience.


### ReactDOMServer.renderToStaticMarkup

```javascript
string renderToStaticMarkup(ReactElement element)
```

Similar to `renderToString`, except this doesn't create extra DOM attributes such as `data-react-id`, that React uses internally. This is useful if you want to use React as a simple static page generator, as stripping away the extra attributes can save lots of bytes.
