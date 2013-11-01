---
id: addons
title: Add-ons
layout: docs
permalink: addons.html
prev: tooling-integration.html
next: animation.html
---

`React.addons` is where we park some useful utilities for building React apps. **These should be considered experimental** but will eventually be rolled into core or a blessed utilities library:

- `ReactTransitions`, for dealing with animations and transitions that are usually not simple to implement, such as before a component's removal.
- `ReactLink`, to simplify the coordination between user's form input data and and the component's state.
- `classSet`, for manipulating the DOM `class` string a bit more cleanly.

To get the add-ons, use `react-with-addons.js` (and its minified counterpart) rather than the common `react.js`.
