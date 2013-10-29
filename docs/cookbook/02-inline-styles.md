---
id: inline-styles
title: Inline Styles
layout: cookbook
permalink: inline-styles.html
next: if-else-in-JSX.html
prev: introduction.html
---

In React, inline styles are not specified as a string, but as an object whose key is the camelCased version of the style name, and whose value is the style's value in string:

```js
/** @jsx React.DOM */

var divStyle = {
  color: 'white',
  backgroundImage: 'url(' + imgUrl + ')',
  WebkitTransition: 'all' // note the capital 'W' here
};

React.renderComponent(<div style={divStyle}>Hello World!</div>, mountNode);
```

Style keys are camelCased in order to be consistent with accessing the properties using node.style.___ in DOM. This also explains why WebkitTransition has an uppercase "W".
