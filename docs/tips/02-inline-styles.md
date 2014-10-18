---
id: inline-styles
title: Inline Styles
layout: tips
permalink: inline-styles.html
next: if-else-in-JSX.html
prev: introduction.html
---

In React, inline styles are not specified as a string. Instead they are specified with an object whose key is the camelCased version of the style name, and whose value is the style's value, usually a string ([more on that later](/react/tips/style-props-value-px.html)):

```js
var divStyle = {
  color: 'white',
  backgroundImage: 'url(' + imgUrl + ')',
  WebkitTransition: 'all', // note the capital 'W' here
  msTransition: 'all' // 'ms' is the only lowercase vendor prefix
};

React.render(<div style={divStyle}>Hello World!</div>, mountNode);
```

Style keys are camelCased in order to be consistent with accessing the properties on DOM nodes from JS (e.g. `node.style.backgroundImage`). Vendor prefixes [other than `ms`](http://www.andismith.com/blog/2012/02/modernizr-prefixed/) should begin with a capital letter. This is why `WebkitTransition` has an uppercase "W".
