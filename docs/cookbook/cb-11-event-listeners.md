---
id: event-listeners
title: event listening in a React component
layout: docs
permalink: event-listeners.html
---

### Problem
You want to listen to an event inside a React component.

### Solution
You can listen in componentDidMount. The below example will display the window dimensions.

```js
var WindowDimensions = React.createClass({
  render: function() {
    return <span>{this.state.width} x {this.state.height}</span>;
  },
  updateDimensions: function() {
    this.setState({width: $(window).width(), height: $(window).height()});
  },
  componentWillMount: function() {
    this.updateDimensions();
  },
  componentDidMount: function() {
    window.addEventListener("resize", this.updateDimensions);
    // Using jQuery $(window).on('resize', this.updateDimensions);
  },
  componentWillUnmount: function() {
    window.removeEventListener("resize", this.updateDimensions);
    // Using jQuery $(window).off('resize', this.updateDimensions);
  }
});
```

### Discussion
componentDidMount is invoked when the component has been mounted and has a DOM representation. Use this as an opportunity to operate on the DOM when the component has been initialized and rendered for the first time.