---
id: addons
title: Add-ons
permalink: addons.html
prev: tooling-integration.html
next: animation.html
---

`React.addons` is where we park some useful utilities for building React apps. **These should be considered experimental** but will eventually be rolled into core or a blessed utilities library:

- [`TransitionGroup` and `CSSTransitionGroup`](animation.html), for dealing with animations and transitions that are usually not simple to implement, such as before a component's removal.
- [`LinkedStateMixin`](two-way-binding-helpers.html), to simplify the coordination between user's form input data and the component's state.
- [`classSet`](class-name-manipulation.html), for manipulating the DOM `class` string a bit more cleanly.
- [`cloneWithProps`](clone-with-props.html), to make shallow copies of React components and change their props.
- [`update`](update.html), a helper function that makes dealing with immutable data in JavaScript easier.
- [`PureRenderMixin`](pure-render-mixin.html), a performance booster under certain situations.

The add-ons below are in the development (unminified) version of React only:

- [`TestUtils`](test-utils.html), simple helpers for writing test cases (unminified build only).
- [`Perf`](perf.html), for measuring performance and giving you hint where to optimize.

To get the add-ons, use `react-with-addons.js` (and its minified counterpart) rather than the common `react.js`.

When using the react package from npm, just simply `require('react/addons')` instead of `require('react')` to get React with all of the addons.
