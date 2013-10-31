---
id: addons
title: Add-ons
layout: docs
permalink: addons.html
prev: tooling-integration.html
next: examples.html
---

`React.addons` is where we park some useful utilities for building React apps. **These should be considered experimental** but will eventually be rolled into core or a blessed utilities library.

## CSS Animation and Transitions

`ReactTransitions` is an easy way to perform CSS transitions and animations when a React component enters or leaves the DOM. `ReactTransitions` is inspired by the excellent [ng-animate](http://www.nganimate.org/) library.

### Getting Started

`ReactTransitionGroup` is the interface to `ReactTransitions`. This is a simple element that wraps all of the components you are interested in animating. Here's an example where we fade list items in and out.

```javascript{22-24}
/** @jsx React.DOM */

var ReactTransitionGroup = React.addons.TransitionGroup;

var TodoList = React.createClass({
  getInitialState: function() {
    return {items: ['hello', 'world', 'click', 'me']};
  },
  handleAdd: function() {
    var newItems =
      this.state.items.concat([prompt('Enter some text')]);
    this.setState({items: newItems});
  },
  handleRemove: function(i) {
    var newItems = this.state.items;
    newItems.splice(i, 1)
    this.setState({items: newItems});
  },
  render: function() {
    var items = this.state.items.map(function(item, i) {
      return (
        <div key={i} onClick={this.handleRemove.bind(this, i)}>
          {item}
        </div>
      );
    }.bind(this));
    return (
      <div>
        <div><button onClick={this.handleAdd} /></div>
        <ReactTransitionGroup transitionName="example">
          {items}
        </ReactTransitionGroup>
      </div>
    );
  }
});
```

In this component, when a new item is added `ReactTransitionGroup` it will get the `example-enter` CSS class and the `example-enter-active` CSS class added in the next tick. This is a convention based on the `transitionName` prop.

You can use these classes to trigger a CSS animation or transition. For example, try adding this CSS and adding a new list item:

```css
.example-enter {
  opacity: 0.01;
  transition: opacity .5s ease-in;
}

.example-enter.example-enter-active {
  opacity: 1;
}
```

You'll notice that when you try to remove an item `ReactTransitionGroup` keeps it in the DOM. If you're using an unminified build of React you'll see a warning that React was expecting an animation or transition to occur. That's because `ReactTransitionGroup` keeps your DOM elements on the page until the animation completes. Try adding this CSS:

```css
.example-leave {
  opacity: 1;
  transition: opacity .5s ease-in;
}

.example-leave.example-leave-active {
  opacity: 0.01;
}
```

### Disabling Animations

You can disable animating `enter` or `leave` animations if you want. For example, sometimes you may want an `enter` animation and no `leave` animation, but `ReactTransitionGroup` waits for an animation to complete before removing your DOM node. You can add `transitionEnter={false}` or `transitionLeave={false}` props to `ReactTransitionGroup` to disable these animations.

### Rendering a Different Component

By default `ReactTransitionGroup` renders as a `span`. You can change this behavior by providing a `component` prop. For example, here's how you would render a `<ul>`:

```javascript{3}
<ReactTransitionGroup
  transitionName="example"
  component={React.DOM.ul}>
  ...
</ReactTransitionGroup>
```

`component` does not need to be a DOM component. It can be any component you want; even one you've written yourself!

## ReactLink

`ReactLink` is an easy way to express two-way binding with React.

In React, data flows one way: from owner to child. This is because data only flows one direction in [the Von Neumann model of computing](http://en.wikipedia.org/wiki/Von_Neumann_architecture). You can think of it as "one-way data binding."

However, there are lots of applications that require you to read some data and flow it back into your program. For example, when developing forms, you'll often want to update some React `state` when you receive user input. Or perhaps you want to perform layout in JavaScript and react to changes in some DOM element size.

In React, you would implement this by listening to a "change" event, read from your data source (usually the DOM) and call `setState()` on one of your components. "Closing the data flow loop" explicitly leads to more understandable and easier-to-maintain programs. See [our forms documentation](./forms.html) for more information.

Two-way binding -- implicitly enforcing that some value in the DOM is always consistent with some React `state` -- is concise and supports a wide variety of applications. We've provided `ReactLink`: syntactic sugar for setting up the common data flow loop pattern described above, or "linking" some data source to React `state`.

> Note:
>
> ReactLink is just a thin wrapper and convention around the `onChange`/`setState()` pattern. It doesn't fundamentally change how data flows in your React application.

### ReactLink: Before and After

Here's a simple form example without using `ReactLink`:

```javascript
/** @jsx React.DOM */

var NoLink = React.createClass({
  getInitialState: function() {
    return {value: 'Hello!'};
  },
  handleChange: function(event) {
    this.setState({value: event.target.value});
  },
  render: function() {
    var value = this.state.value;
    return <input type="text" value={value} onChange={this.handleChange} />;
  }
});
```

This works really well and it's very clear how data is flowing, however with a lot of form fields it could get a bit verbose. Let's use `ReactLink` to save us some typing:

```javascript{4,9}
/** @jsx React.DOM */

var WithLink = React.createClass({
  mixins: [React.addons.LinkedStateMixin],
  getInitialState: function() {
    return {value: 'Hello!'};
  },
  render: function() {
    return <input type="text" valueLink={this.linkState('value')} />;
  }
});
```

`LinkedStateMixin` adds a method ot your React component called `linkState()`. `linkState()` returns a `ReactLink` object which contains the current value of the React state and a callback to change it.

`ReactLink` objects can be passed up and down the tree as props, so it's easy (and explicit) to set up two-way binding between a component deep in the hierarchy and state that lives higher in the hierarchy.

### Under the Hood

There are two sides to `ReactLink`: the place where you create the `ReactLink` instance and the place where you use it. To prove how simple `ReactLink` is, let's rewrite each side separately to be more explicit.

#### ReactLink Without LinkedStateMixin

```javascript{7-9,11-14}
/** @jsx React.DOM */

var WithoutMixin = React.createClass({
  getInitialState: function() {
    return {value: 'Hello!'};
  },
  handleChange: function(newValue) {
    this.setState({value: newValue});
  },
  render: function() {
    var valueLink = {
      value: this.state.value,
      requestChange: this.handleChange
    };
    return <input type="text" valueLink={valueLink} />;
  }
});
```

As you can see, `ReactLink` objects are very simple objects that just have a `value` and `requestChange` prop. And `LinkedStateMixin` is similarly simple: it just populates those fields with a value from `this.state` and a callback that calls `this.setState()`.

#### ReactLink Without valueLink

```javascript
/** @jsx React.DOM */

var WithoutLink = React.createClass({
  mixins: [React.addons.LinkedStateMixin],
  getInitialState: function() {
    return {value: 'Hello!'};
  },
  render: function() {
    var valueLink = this.linkState('value');
    var handleChange = function(e) {
      valueLink.requestChange(e.target.value);
    };
    return <input type="text" value={valueLink.value} onChange={handleChange} />;
  }
});
```

The `valueLink` prop is also quite simple. It simply handles the `onChange` event and calls `this.props.valueLink.requestChange()` and also uses `this.props.valueLink.value` instead of `this.props.value`. That's it!
