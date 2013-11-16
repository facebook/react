---
id: break-render-into-chunks
title: Break Render into Chunks
layout: tips
permalink: break-render-into-chunks.html
prev: false-in-jsx.html
---

When your `render` gets too big, break it into smaller methods:

```js
/** @jsx React.DOM */

var Grid = React.createClass({
  renderCell: function() {
    var cellStyle = {
      border: '1px solid gray',
      display: 'inline-block',
      margin: 5,
      padding: 5
    };
    return <div style={cellStyle} />;
  },

  renderRow: function() {
    var row = [];
    for (var i = 0; i < 5; i++) {
      row.push(this.renderCell());
    }
    return <div>{row}</div>;
  },

  render: function() {
    // 3 x 5 grid
    var grid = [];
    for (var i = 0; i < 3; i++) {
      grid.push(this.renderRow());
    }
    return <div>{grid}</div>;
  }
});

React.renderComponent(<Grid />, mountNode);
```
