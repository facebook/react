---
id: props-in-getInitialSate-as-anti-pattern
title: props in getInitialState is an anti-pattern
layout: docs
permalink: props-in-getInitialSate-as-anti-pattern.html
---

### Problem
You're using `this.props` in a component `getInitialSate`, like so:

```js
/** @jsx React.DOM */

var MessageBox = React.createClass({
  getInitialState: function() {
    return {nameWithQualifier: "Mr. " + this.props.name};
  },
  render: function() {
    return <div>{this.state.nameWithQualifier}</div>;
  }
});

React.renderComponent(<MessageBox name="Zuck"/>, mountNode);
```

### Solution
Avoid this (see below for explanation). Compute it directly inside `render`:

```js
/** @jsx React.DOM */

var MessageBox = React.createClass({
  render: function() {
    return <div>{"Mr. " + this.props.name}</div>;
  }
});

React.renderComponent(<MessageBox name="Zuck"/>, mountNode);
```

For more complex logic:

```js
/** @jsx React.DOM */

var MessageBox = React.createClass({
  render: function() {
    return <div>{this.getNameWithQualifier(this.props.name)}</div>;
  },
  getNameWithQualifier: function(name) {
    return 'Mr. ' + name;
  }
});

React.renderComponent(<MessageBox name="Zuck"/>, mountNode);
```

### Discussion
This isn't really a React-specific tip, as such anti-patterns often occur in code in general; in this case, React simply points them out more clearly.

Using props, passed down from parent, to generate state often leads to duplication of "source of truth", i.e. where the real data is. Whenever possible, compute values on-the-fly to ensure that they don't get out of sync later on and cause maintenance trouble.
