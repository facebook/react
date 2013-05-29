---
id: docs-component-data
title: Component Data
description: How is data passed into a component?
layout: docs
prev: component-basics.html
next: component-lifecycle.html
---

## Props

Components use data to determine what should be rendered. For example:

```javascript
var LikeLink = React.createClass({
  render: function() {
    var text = this.props.liked ? 'Liked' : 'Like';
    return <a>{text}</a>;
  }
});
var myLikeLink = <LikeLink liked={false} />;
```

In this example, `LikeLink` takes `liked` as boolean data. This type of data
that is passed in is called a "prop". Examples of props on DOM components
include `className` and `onClick`.

Whenever a component's props change, its `render()` function will be
re-evaluated and the DOM will be updated. React will ensure that the DOM is
always kept up-to-date.

## State

Let's build a small `LikeApp` application that makes use of the `<LikeLink>`
component from above. It should start off unliked and we should be able to like
it by clicking the link:

```javascript
var LikeApp = React.createClass({
  render: function() {
    var isClicked = false;
    return <LikeLink liked={isClicked} onClick={this.handleClick.bind(this)} />;
  },
  handleClick: function() {
    // Somehow update `isClicked`.
  }
});
```

This renders a `<LikeLink>` with a click listener. However, it is not clear how
`handleClick` should update `isClicked` to true. `LikeApp` needs a way to store
**state** about whether or not it has been clicked.

### State vs. Props

State is data that is managed _internally_ by a composite component. Like props,
the `render()` function will be re-evaluated whenever state changes. Props and
state differ in that:

 - Props are passed in from the creator.
 - State is private to and managed by the component.

### Managing State

Let's update our `LikeApp` component using state:

```javascript{2-4,6,10}
var LikeApp = React.createClass({
  getInitialState: function() {
    return {isClicked: false};
  },
  render: function() {
    var isClicked = this.state.isClicked;
    return <LikeLink liked={isClicked} onClick={this.handleClick.bind(this)} />;
  },
  handleClick: function() {
    this.setState({isClicked: true});
  }
});
```

There's a lot going on here, so let's work our way from top to bottom:

 - `getInitialState()` describes what state data looks like when the component
   is created.
 - In `render()`, state data can be accessed via `this.state`.
 - When the link is clicked, we update state using `setState()`.

Now when we click the link, the `<LikeLink>` will get updated, right? Wrong.

## Transferring Props

If you have been following carefully, you may have noticed that although we pass
a click handler into `<LikeLink>` as a prop, `LikeLink` does not do anything
with `this.props.onClick`! Let's fix that.

```javascript{4}
var LikeLink = React.createClass({
  render: function() {
    var text = this.props.liked ? 'Liked' : 'Like';
    return <a onClick={this.props.onClick}>{text}</a>;
  }
});
```

Although this works, realize that this would quickly become tedious if we wanted
to also transfer `href`, `title`, `target`, and other events from `this` to the
rendered `<a>`. React provides a convenience method, `transferPropsTo()`, for
transferring props:

```javascript{4}
var LikeLink = React.createClass({
  render: function() {
    var text = this.props.liked ? 'Liked' : 'Like';
    return this.transferPropsTo(<a>{text}</a>);
  }
});
```

This will transfer all props from `this` to the specified component (including
`onClick`).

## Summary

Now we are done. `LikeApp` renders an unliked link which, when clicked, will:

1. Update the internal state of `LikeApp`.
2. Change the props passed into `LikeLink`.
3. Change the return value of `render()`.
4. Trigger an update to the DOM.

It's worth noting that React will handle new return values of `render()` by
making the minimal set of mutations necessary to bring the DOM up-to-date. In
this case, only the `textContent` of the rendered link will be mutated.

In summary:

 - Props are passed in whereas state is managed internally by a component.
 - Never mutate `this.props` or `this.state`. You should pass props into other
   components and mutate state using `setState()`.
 - State is private. Never read `state` or call `setState()` on
   anything but `this`.
 - Whenever props or state changes, `render()` will be re-evaluated and the DOM
   updated. Also, `render()` should not depend on anything besides `this.props`
   and `this.state`.
