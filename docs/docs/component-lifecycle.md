---
id: docs-component-lifecycle
title: Component Lifecycle
description: What happens when I render a React component?
layout: docs
prev: component-data.html
next: event-handling.html
---

## Mounting

[We have previously seen](component-basics.html) how to render components into
existing DOM elements on the page:

```javascript
React.renderComponent(<div>Hello, world!</div>, document.body);
```

In this one simple line, we have accomplished the following:

 - A `<div>` (defined by `React.DOM.div`) component is instantiated.
 - The component is **mounted** into `document.body`.

**Mounting** is the process of initializing a React component by creating its
DOM nodes and inserting the them into a supplied container node.

At this point, the entire page consists of a single `<div>` with "Hello,
world!".

## Updating

Let's add a second call to `React.renderComponent()` after three
seconds:

```javascript{2-4}
React.renderComponent(<div>Hello, world!</div>, document.body);
setTimeout(function() {
  React.renderComponent(<div>Goodbye, world.</div>, document.body);
}, 3000);
```

The second call to `React.renderComponent()` will trigger the following:

 - The `<div>` component will check the new props to see if anything changed.
 - The set of changes are used to **update** the DOM node as necessary.

**Updating** is the process of mutating the rendered DOM nodes and occurs
whenever either props or state has changed. This ensures that the rendered DOM
is consistent with the data.

## Unmounting

Let's add one final call to `React.renderComponent()` after another three
seconds:

```javascript{5-7}
React.renderComponent(<div>Hello, world!</div>, document.body);
setTimeout(function() {
  React.renderComponent(<div>Goodbye, world.</div>, document.body);
}, 3000);
setTimeout(function() {
  React.renderComponent(<img src="/images/fin.png" />, document.body);
}, 6000);
```

The third call to `React.renderComponent()` will trigger the following:

 - An `<img>` (defined by `React.DOM.img`) component is instantiated.
 - React will compare the `<div>` component with the `<img>` component.
 - Since the component class is different, the `<div>` component will be
   **unmounted**.
 - The `<img>` component will then be mounted into `document.body`.

**Unmounting** is the process of releasing resources that have been allocated by
a component. This allows user interfaces built with React to live long without
memory leaks.

Components can also be unmounted using
`React.unmountAndReleaseReactRootNode()`:

```javascript
React.unmountAndReleaseReactRootNode(document.body);
```

This will unmount any components mounted immediately within `document.body`.
