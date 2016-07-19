---
id: style-props-value-px
title: Shorthand for Specifying Pixel Values in style props
layout: tips
permalink: tips/style-props-value-px.html
prev: maximum-number-of-jsx-root-nodes.html
next: children-props-type.html
---

When specifying a pixel value for your inline `style` prop, React automatically appends the string "px" for you after your number value, so this works:

```js
var divStyle = {height: 10}; // rendered as "height:10px"
ReactDOM.render(<div style={divStyle}>Hello World!</div>, mountNode);
```

See [Inline Styles](/react/tips/inline-styles.html) for more info.

Sometimes you _do_ want to keep the CSS properties unitless. Here's a list of properties that won't get the automatic "px" suffix:

- `animationIterationCount`
- `boxFlex`
- `boxFlexGroup`
- `boxOrdinalGroup`
- `columnCount`
- `fillOpacity`
- `flex`
- `flexGrow`
- `flexPositive`
- `flexShrink`
- `flexNegative`
- `flexOrder`
- `fontWeight`
- `lineClamp`
- `lineHeight`
- `opacity`
- `order`
- `orphans`
- `stopOpacity`
- `strokeDashoffset`
- `strokeOpacity`
- `strokeWidth`
- `tabSize`
- `widows`
- `zIndex`
- `zoom`
