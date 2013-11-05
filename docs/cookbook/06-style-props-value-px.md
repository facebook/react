---
id: style-prop-value-px
title: Shorthand for Specifying Pixel Values in style props
layout: cookbook
permalink: style-props-value-px.html
prev: maximum-number-of-jsx-root-nodes.html
next: children-props-type.html
---

When specifying a pixel value for your inline `style` prop, React automatically appends the string "px" for you after your number value, so this works:

```js
/** @jsx React.DOM */

var divStyle = {height: 10}; // rendered as "height:10px"
React.renderComponent(<div style={divStyle}>Hello World!</div>, mountNode);
```

See [Inline Styles](/react/docs/cookbook/inline-styles-tip.html) for more info.

Sometimes you _do_ want to keep the CSS properties unitless. Here's a list of properties that won't get the automatic "px" suffix:

- fillOpacity
- fontWeight
- lineHeight
- opacity
- orphans
- zIndex
- zoom
