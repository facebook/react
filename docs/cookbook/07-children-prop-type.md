---
id: children-prop-type
title: Type of the children prop
layout: cookbook
permalink: children-prop-type.html
prev: style-prop-value-px.html
next: controlled-input-null-value.html
---

Usually, a component's `this.props.children` is an array of components:

```js
/** @jsx React.DOM */

var GenericWrapper = React.createClass({
  componentDidMount: function() {
    console.log(Array.isArray(this.props.children)); // => true
  },
  render: function() {
    return <div />;
  }
});

React.renderComponent(
  <GenericWrapper><span/><span/><span/></GenericWrapper>, 
  mountNode
);
```

To save an extra array allocation, it returns the component itself _without the array wrapper_ when there's only one child.

```js
/** @jsx React.DOM */

var GenericWrapper = React.createClass({
  componentDidMount: function() {
    // **warning**: yields 5 for length of the string 'hello', not 1 for the
    // length of the non-existant array wrapper!
    console.log(this.props.children.length); 
  },
  render: function() {
    return <div />;
  }
});

React.renderComponent(<GenericWrapper>hello</GenericWrapper>, mountNode);
```
