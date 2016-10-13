---
id: clone-with-props
title: Cloning React Elements
layout: docs
category: Add-Ons
permalink: docs/clone-with-props.html
---

> Note: cloneWithProps is deprecated.
>
> Use [React.cloneElement](/react/docs/react-api.html#react.cloneelement) instead.

In rare situations, you may want to create a copy of a React element with different props from those of the original element. One example is cloning the elements passed into `this.props.children` and rendering them with different props:

```js
var cloneWithProps = require('react-addons-clone-with-props');

var _makeBlue = function(element) {
  return cloneWithProps(element, {style: {color: 'blue'}});
};

var Blue = React.createClass({
  render: function() {
    var blueChildren = React.Children.map(this.props.children, _makeBlue);
    return <div>{blueChildren}</div>;
  }
});

ReactDOM.render(
  <Blue>
    <p>This text is blue.</p>
  </Blue>,
  document.getElementById('container')
);
```

`cloneWithProps` does not transfer `key` or `ref` to the cloned element. `className` and `style` props are automatically merged.
