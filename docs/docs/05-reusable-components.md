---
id: reusable-components
title: Reusable Components
layout: docs
permalink: reusable-components.html
prev: multiple-components.html
next: forms.html
---

When designing interfaces, break down the common design elements (buttons, form fields, layout components, etc) into reusable components with well-defined interfaces. That way, the next time you need to build some UI you can write much less code, which means faster development time, less bugs, and less bytes down the wire.


## Prop Validation

As your app grows it's helpful to ensure that your components are used correctly. We do this using `propTypes`.

** TODO zpao **


## Transferring Props: A Shortcut

A common type of React component is one that extends a basic HTML in a simple way. Often you'll want to copy any HTML attributes passed to your component to the underlying HTML element to save typing. React provides `transferPropsTo()` to do just this.

```javascript
/** @jsx React.DOM */

var CheckLink = React.createClass({
  render: function() {
    // transferPropsTo() will take any props pased to CheckLink
    // and copy them to <a>
    return this.transferPropsTo(<a>{'√ '}{this.props.children}</a>);
  }
});

React.renderComponent(
  <CheckLink href="javascript:alert('Hello, world!');">
    Click here!
  </CheckLink>,
  document.getElementById('example')
);
```


## Mixins

Components are the best way to reuse code in React, but sometimes very different components may share some common functionality. These are sometimes called [cross-cutting concerns](http://en.wikipedia.org/wiki/Cross-cutting_concern). React provides `mixins` to solve this problem.

One common use case is a component wanting to update itself on a time interval. It's easy to use `setInterval()`, but it's important to cancel your interval when you don't need it anymore to save memory. React provides [lifecycle methods](./working-with-the-browser.html) that let you know when a component is about to be created or destroyed. Let's create a simple mixin that uses these methods to provide an easy `setInterval()` function that will automatically get cleaned up when your component is destroyed.

```javascript
/** @jsx React.DOM */

var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },
  componentWillUnmount: function() {
    this.intervals.map(clearInterval);
  }
};

var TickTock = React.createClass({
  mixins: [SetIntervalMixin], // Use the mixin
  getInitialState: function() {
    return {seconds: 0};
  },
  componentDidMount: function() {
    this.setInterval(this.tick, 1000); // Call a method on the mixin
  },
  tick: function() {
    this.setState({seconds: this.state.seconds + 1});
  },
  render: function() {
    return (
      <p>
        React has been running for {this.state.seconds} seconds.
      </p>
    );
  }
});

React.renderComponent(
  <TickTock />,
  document.getElementById('example')
);
```

A nice feature of mixins is that if a component is using multiple mixins and several mixins define the same lifecycle method (i.e. several mixins want to do some cleanup when the component is destroyed), all of the lifecycle methods are guaranteed to be called.


## Testing

**TODO: benjamn**
