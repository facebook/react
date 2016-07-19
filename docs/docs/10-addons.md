---
id: addons
title: Add-ons
permalink: docs/addons.html
prev: environments.html
next: animation.html
---

The React add-ons are a collection of useful utility modules for building React apps. **These should be considered experimental** and tend to change more often than the core.

- [`TransitionGroup` and `CSSTransitionGroup`](animation.html), for dealing with animations and transitions that are usually not simple to implement, such as before a component's removal.
- [`LinkedStateMixin`](two-way-binding-helpers.html), to simplify the coordination between user's form input data and the component's state.
- [`cloneWithProps`](clone-with-props.html), to make shallow copies of React components and change their props.
- [`createFragment`](create-fragment.html), to create a set of externally-keyed children.
- [`update`](update.html), a helper function that makes dealing with immutable data in JavaScript easier.
- [`PureRenderMixin`](pure-render-mixin.html), a performance booster under certain situations.
- [`shallowCompare`](shallow-compare.html), a helper function that performs a shallow comparison for props and state in a component to decide if a component should update.

The add-ons below are in the development (unminified) version of React only:

- [`TestUtils`](test-utils.html), simple helpers for writing test cases.
- [`Perf`](perf.html), a performance profiling tool for finding optimization opportunities.

To get the add-ons, install them individually from npm (e.g., `npm install react-addons-pure-render-mixin`). We don't support using the addons if you're not using npm.
