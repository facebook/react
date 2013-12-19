---
id: top-level-api
title: Top-Level API
layout: docs
permalink: top-level-api.html
next: component-api.html
---

## React

`React` is the entry point to the React framework. If you're using one of the prebuilt packages it's available as a global; if you're using CommonJS modules you can `require()` it.


### React.DOM

`React.DOM` provides all of the standard HTML tags needed to build a React app. You generally don't use it directly; instead, just include it as part of the `/** @jsx React.DOM */` docblock.


### React.initializeTouchEvents

```javascript
initializeTouchEvents(boolean shouldUseTouch)
```

Configure React's event system to handle touch events on mobile devices.


### React.createClass

```javascript
function createClass(object specification)
```

Creates a component given a specification. A component implements a `render` method which returns **one single** child. That child may have an arbitrarily deep child structure. One thing that makes components different than standard prototypal classes is that you don't need to call new on them. They are convenience wrappers that construct backing instances (via new) for you.

For more information about the specification object, see [Component Specs and Lifecycle](/react/docs/component-specs.html).


### React.renderComponent

```javascript
ReactComponent renderComponent(
  ReactComponent component,
  DOMElement container,
  [function callback]
)
```

Renders a React component into the DOM in the supplied `container`.

If the React component was previously rendered into `container`, this will perform an update on it and only mutate the DOM as necessary to reflect the latest React component.

If the optional callback is provided, it will be executed after the component is rendered or updated.


### React.unmountComponentAtNode

```javascript
unmountComponentAtNode(DOMElement container)
```

Remove a mounted React component from the DOM and clean up its event handlers and state.

> Note:
>
> This method was called `React.unmountAndReleaseReactRootNode` until v0.5. It still works in v0.5 but will be removed in future versions.


### React.renderComponentToString

```javascript
renderComponentToString(ReactComponent component, function callback)
```

Render a component to its initial HTML. This should only be used on the server. React will call `callback` with an HTML string when the markup is ready. You can use this method to can generate HTML on the server and send the markup down on the initial request for faster page loads and to allow search engines to crawl your pages for SEO purposes.

If you call `React.renderComponent()` on a node that already has this server-rendered markup, React will preserve it and only attach event handlers, allowing you to have a very performant first-load experience.
