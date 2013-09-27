---
id: inline-styles
title: Inline Styles
layout: docs
permalink: inline-styles.html
script: "cookbook/inline-styles.js"
---

## Q&A format

### Problem
You want to put inline style to an element.

### Solution
Instead of writing a string, create an object whose key is the camelCased version of the style name, and whose value is the style's value, in string:

```html
/** @jsx React.DOM */

var divStyle = {
  color: 'white',
  backgroundColor: 'lightblue',
  WebkitTransition: 'all' // note the capital 'W' here
};

React.renderComponent(<div style={divStyle}>Hello World!</div>, mountNode);
```

### Discussion
Style keys are camelCased in order to be consistent with accessing the properties using `node.style.___` in DOM. This also explains why `WebkitTransition` has an uppercase 'W'.

## Tips format

In React, inline styles are nto specified as a string, but as an object whose key is the camelCased version of the style name, and whose value is the style's value in string:

```html
/** @jsx React.DOM */

var divStyle = {
  color: 'white',
  backgroundColor: 'lightblue',
  WebkitTransition: 'all' // note the capital 'W' here
};

React.renderComponent(<div style={divStyle}>Hello World!</div>, mountNode);
```

Style keys are camelCased in order to be consistent with accessing the properties using node.style.___ in DOM. This also explains why WebkitTransition has an uppercase 'W'.
