---
id: external-libraries-integration-tip
title: Integration with external libraries
layout: docs
permalink: external-libraries-integration-tip.html
---

Let's try jQuery.

The general concept is simple: treat `componentDidMount` as jQuery's `ready` and tag your component with a `ref`. Then, call its `getDOMNode`. Notice that with `ref` (component scope), you don't need selectors anymore!

```js
/** @jsx React.DOM */

var ToggleBox = React.createClass({
  componentDidMount: function() {
    $(this.refs.dialogueBox.getDOMNode()).hide().fadeIn(500);
  },
  render: function() {
    return (
      <div>
        <button onClick={this.handleClick}>Toggle me!</button>
        <div
          ref="dialogueBox"
          style={{border: '1px solid gray', width: 90, height: 90, padding: 10}}
        >
          Easy!
        </div>
      </div>
    );
  },
  handleClick: function() {
    $(this.refs.dialogueBox.getDOMNode()).stop().toggle(200);
  }
});

React.renderComponent(<ToggleBox />, mountNode);
```

Use libraries like jQuery for things like animation and AJAX, but preferably, don't manipulate the DOM with it. There are mostly likely better way to achieve that if you're already using React.
