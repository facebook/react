---
id: references-to-components
title: References to Components
layout: tips
permalink: references-to-components.html
prev: expose-component-functions.html
next: children-undefined.html
---

If you're using React components in a larger non-React application, transitioning your code to React, or writing a test suite for your React application, you may need to keep references to components. `React.renderComponent` returns a reference to the mounted component:

```js
/** @jsx React.DOM */

var myComponent = React.renderComponent(<MyComponent />, myContainer);
```

Keep in mind that a reference to `<MyComponent />` (or the equivalent `MyComponent()`) is not a component instance! It is a **descriptor**: a lightweight representation that tells React what the mounted component should look like. Because descriptors are lightweight, they lack custom methods and other features that component instances have. 
```js
/** @jsx React.DOM */

var myDescriptor = <MyComponent />; // This is just a descriptor.
myDescriptor.someCustomMethod();    // NOT OK - someCustomMethod is undefined

// Some code here...

var myComponent = React.renderComponent(myDescriptor, myContainer);
myComponent.someCustomMethod();     // OK
```

> Note:
>
> This should only ever be used at the top level. Inside components, let your `props` and `state` handle communication with child components, and only reference components via [refs](http://facebook.github.io/react/docs/more-about-refs.html).
