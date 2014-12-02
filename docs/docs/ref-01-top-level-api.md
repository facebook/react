---
id: top-level-api
title: Top-Level API
permalink: top-level-api.html
next: component-api.html
redirect_from: "/docs/reference.html"
---

## React

`React` is the entry point to the React framework. If you're using one of the prebuilt packages it's available as a global; if you're using CommonJS modules you can `require()` it.


### React.createClass

```javascript
function createClass(object specification)
```

Create a component given a specification. A component implements a `render` method which returns **one single** child. That child may have an arbitrarily deep child structure. One thing that makes components different than standard prototypal classes is that you don't need to call new on them. They are convenience wrappers that construct backing instances (via new) for you.

For more information about the specification object, see [Component Specs and Lifecycle](/react/docs/component-specs.html).


### React.createElement

```javascript
function createElement(
  string/ReactComponent type,
  [object props],
  [children ...]
)
```

Create and return a new ReactElement of the given type. The type argument can be either an
html tag name string (eg. 'div', 'span', etc), or a `ReactComponent` class that was created
with `React.createClass`.


### React.render

```javascript
ReactComponent render(
  ReactElement element,
  DOMElement container,
  [function callback]
)
```

Render a ReactElement into the DOM in the supplied `container` and return a reference to the component.

If the ReactElement was previously rendered into `container`, this will perform an update on it and only mutate the DOM as necessary to reflect the latest React component.

If the optional callback is provided, it will be executed after the component is rendered or updated.

> Note:
>
> `React.render()` replaces the contents of the container node you
> pass in. In the future, it may be possible to insert a component to an
> existing DOM node without overwriting the existing children.


### React.unmountComponentAtNode

```javascript
boolean unmountComponentAtNode(DOMElement container)
```

Remove a mounted React component from the DOM and clean up its event handlers and state. If no component was mounted in the container, calling this function does nothing. Returns `true` if a component was unmounted and `false` if there was no component to unmount.


### React.renderToString

```javascript
string renderToString(ReactElement element)
```

Render a ReactElement to its initial HTML. This should only be used on the server. React will return an HTML string. You can use this method to generate HTML on the server and send the markup down on the initial request for faster page loads and to allow search engines to crawl your pages for SEO purposes.

If you call `React.render()` on a node that already has this server-rendered markup, React will preserve it and only attach event handlers, allowing you to have a very performant first-load experience.


### React.renderToStaticMarkup

```javascript
string renderToStaticMarkup(ReactElement element)
```

Similar to `renderToString`, except this doesn't create extra DOM attributes such as `data-react-id`, that React uses internally. This is useful if you want to use React as a simple static page generator, as stripping away the extra attributes can save lots of bytes.


### React.isValidElement

```javascript
boolean isValidElement(* object)
```

Verifies the object is a ReactElement.


### React.DOM

`React.DOM` provides convenience wrappers around `React.createElement` for DOM components. These should only be used when not using JSX. For example, `React.DOM.div(null, 'Hello World!')`


### React.PropTypes

`React.PropTypes` includes types that can be used with a component's `propTypes` object to validate props being passed to your components. For more information about `propTypes`, see [Reusable Components](/react/docs/reusable-components.html).


### React.initializeTouchEvents

```javascript
initializeTouchEvents(boolean shouldUseTouch)
```

Configure React's event system to handle touch events on mobile devices.


### React.Children

`React.Children` provides utilities for dealing with the `this.props.children` opaque data structure.

#### React.Children.map

```javascript
object React.Children.map(object children, function fn [, object context])
```

Invoke `fn` on every immediate child contained within `children` with `this` set to `context`. If `children` is a nested object or array it will be traversed: `fn` will never be passed the container objects. If children is `null` or `undefined` returns `null` or `undefined` rather than an empty object.

#### React.Children.forEach

```javascript
React.Children.forEach(object children, function fn [, object context])
```

Like `React.Children.map()` but does not return an object.

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
