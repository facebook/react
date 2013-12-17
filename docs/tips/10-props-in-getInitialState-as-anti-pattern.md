---
id: props-in-getInitialState-as-anti-pattern
title: Props in getInitialState Is an Anti-Pattern
layout: tips
permalink: props-in-getInitialState-as-anti-pattern.html
prev: componentWillReceiveProps-not-triggered-after-mounting.html
next: dom-event-listeners.html
---

> Note:
>
> This isn't really a React-specific tip, as such anti-patterns often occur in code in general; in this case, React simply points them out more clearly.

Using props, passed down from parent, to generate state in `getInitialState` often leads to duplication of "source of truth", i.e. where the real data is (see [denormalization](http://en.wikipedia.org/wiki/Denormalization)). Whenever possible, compute values on-the-fly to ensure that they don't get out of sync later on and cause maintenance trouble. Javascript is plently fast for most use cases.

Bad example:

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

React.renderComponent(<MessageBox name="Rogers"/>, mountNode);
```

Better:

```js
/** @jsx React.DOM */

var MessageBox = React.createClass({
  render: function() {
    return <div>{"Mr. " + this.props.name}</div>;
  }
});

React.renderComponent(<MessageBox name="Rogers"/>, mountNode);
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

React.renderComponent(<MessageBox name="Rogers"/>, mountNode);
```

**But** in situations where your component truly is stateful, using props to initialize that state is totally fine. In such cases, it can be helpful to name the prop `initialX` (or similar) to make it clear that the state will not stay in sync.

For example:

```js
/** @jsx React.DOM */

var Counter = React.createClass({
  getInitialState: function() {
    return {count: this.props.initialCount};
  },
  handleClick: function() {
    this.setState({
      count: this.state.count + 1
    });
  },
  render: function() {
    return (
      <div onClick={this.handleClick}>
        {this.state.count}
      </div>
    );
  }
});

React.renderComponent(<Counter initialCount={7}/>, mountNode);
```
