---
id: addons
title: Add-ons
layout: docs
permalink: addons.html
prev: tooling-integration.html
next: animation.html
---

`React.addons` is where we park some useful utilities for building React apps. **These should be considered experimental** but will eventually be rolled into core or a blessed utilities library:

- [`ReactTransitions`](animation.html), for dealing with animations and transitions that are usually not simple to implement, such as before a component's removal.
- [`ReactLink`](two-way-binding-helpers.html), to simplify the coordination between user's form input data and and the component's state.
- [`classSet()`](class-name-manipulation.html), for manipulating the DOM `class` string a bit more cleanly.
- [`ReactTestUtils`](test-utils.html), simple helpers for writing test cases (unminified build only).
- [`cloneWithProps()`](clone-with-props.html), to make shallow copies of React components and change their props.
- [`update()`](update.html), a helper function that makes dealing with immutable data in JavaScript easier.

To get the add-ons, use `react-with-addons.js` (and its minified counterpart) rather than the common `react.js`.
