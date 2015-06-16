---
id: use-react-with-other-libraries
title: Use React with Other Libraries
layout: tips
permalink: use-react-with-other-libraries.html
prev: children-undefined.html
next: dangerously-set-inner-html.html
---

You don't have to go full React. The component [lifecycle events](/react/docs/component-specs.html#lifecycle-methods), especially `componentDidMount` and `componentDidUpdate`, are good places to put your other libraries' logic.

```js
var App = React.createClass({
  getInitialState: function() {
    return {myModel: new myBackboneModel({items: [1, 2, 3]})};
  },

  componentDidMount: function() {
    $(React.findDOMNode(this.refs.placeholder)).append($('<span />'));
  },

  componentWillUnmount: function() {
    // Clean up work here.
  },

  shouldComponentUpdate: function() {
    // Let's just never update this component again.
    return false;
  },

  render: function() {
    return <div ref="placeholder"/>;
  }
});

React.render(<App />, mountNode);
```

You can attach your own [event listeners](/react/tips/dom-event-listeners.html) and even [event streams](https://baconjs.github.io) this way.
