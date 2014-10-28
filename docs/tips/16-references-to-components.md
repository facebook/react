---
id: references-to-components
title: References to Components
layout: tips
permalink: references-to-components.html
prev: expose-component-functions.html
next: children-undefined.html
---

If you're using React components in a larger non-React application or transitioning your code to React, you may need to keep references to components. `React.render` returns a reference to the mounted component:

```js
var myComponent = React.render(<MyComponent />, myContainer);
```

Keep in mind, however, that the JSX doesn't return a component instance! It's just a **ReactElement**: a lightweight representation that tells React what the mounted component should look like.

```js
var myComponentElement = <MyComponent />; // This is just a ReactElement.

// Some code here...

var myComponentInstance = React.render(myComponentElement, myContainer);
```

> Note:
>
> This should only ever be used at the top level. Inside components, let your `props` and `state` handle communication with child components, and only reference components via [refs](http://facebook.github.io/react/docs/more-about-refs.html).
