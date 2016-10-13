---
id: addons
title: Add-Ons
permalink: docs/addons.html
---

The React add-ons are a collection of useful utility modules for building React apps. **These should be considered experimental** and tend to change more often than the core.

- [`TransitionGroup` and `CSSTransitionGroup`](animation.html), for dealing with animations and transitions that are usually not simple to implement, such as before a component's removal.
- [`createFragment`](create-fragment.html), to create a set of externally-keyed children.
- [`shallowCompare`](shallow-compare.html), a helper function that performs a shallow comparison for props and state in a component to decide if a component should update.

The add-ons below are in the development (unminified) version of React only:

- [`ReactTestUtils`](test-utils.html), simple helpers for writing test cases.
- [`Perf`](perf.html), a performance profiling tool for finding optimization opportunities.

To get the add-ons, install them individually from npm (e.g., `npm install react-addons-test-utils`) or use React with Add-Ons.

## Using React with Add-ons

Use `react-with-addons.js` instead of `react.js` when using a CDN:

```html
<script src="https://unpkg.com/react@15/dist/react-with-addons.js"></script>
```

If using npm, you can import the 'react/addons' package instead:

```javascript
import React from 'react/addons'; // ES6
var React = require('react/addons'); // ES5
```

The add-ons will be available via `React.addons`.

## Legacy Add-ons

The add-ons below are considered legacy and their use is discouraged.

- [`cloneWithProps`](clone-with-props.html)
- [`PureRenderMixin`](pure-render-mixin.html)
- [`LinkedStateMixin`](two-way-binding-helpers.html)
- [`update`](update.html)
