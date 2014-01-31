---
id: references-to-components
title: References to Components
layout: tips
permalink: references-to-components.html
prev: expose-component-functions.html
---

If you're using React components in a larger non-React application or transitioning your code to React, you may need to keep references to components. `React.renderComponent` returns a reference to the mounted component:

```js
/** @jsx React.DOM */

var myComponent = React.renderComponent(<MyComponent />, myContainer);
```

If you pass a variable to 'React.renderComponent`, it's not guaranteed that the component passed in will be the one that's mounted. In cases where you construct a component before mounting it, be sure to reassign your variable:

```js
/** @jsx React.DOM */

var myComponent = <MyComponent />;

// Some code here...

myComponent = React.renderComponent(myComponent, myContainer);
```

> Note:
>
> This should only ever be used at the top level. Inside components, let your `props` and `state` handle communication with child components, and only reference components via `ref`s.
