---
id: faq-internals
title: Virtual DOM and Internals
permalink: docs/faq-internals.html
layout: docs
category: FAQ
---

### What is the Virtual DOM?

The virtual DOM (VDOM) is a programming concept where an ideal, or "virtual" representation of a UI is kept in memory and synced with the "real" DOM by a reconciliation engine/renderer (ie React Fiber + ReactDOM).

React uses the virtual DOM to enable its declarative API: You tell React what state you want the UI to be in, and it makes sure the DOM matches that state. This abstracts out the class manipulation, event handling, and manual DOM updating that you would otherwise have to use to build your app. 

### Is the Shadow DOM the same as the Virtual DOM?

No, they are different. The Shadow DOM is a browser technology designed primarily for scoping variables and CSS in web components. The virtual DOM is a concept implemented by libraries in Javascript on top of browser APIs.

### What is "React Fiber"?

Fiber is the new reconciliation engine in React 16. It's main goal is to enable incremental rendering of the virtual DOM. [Read more](https://github.com/acdlite/react-fiber-architecture).
