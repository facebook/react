---
id: working-with-the-browser
title: Working With the Browser
permalink: docs-old/working-with-the-browser.html
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
