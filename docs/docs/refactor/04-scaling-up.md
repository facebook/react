# Scaling Up: Using Multiple Components

So far, we've looked at how to write a single component to display data and handle user input. Next let's examine one of React's finest features: composability.

## Motivation: separation of concerns

By building modular components that reuse other components with well-defined interfaces, you get much of the same benefits that you get by using functions or classes. Specifically you can *separate the different concerns* of your app however you please simply by building new components. By building a custom component library for your application, you are expressing your UI in a way that best fits your domain.

## Composition example

Let's create a simple Avatar component which shows a profile picture and username using the Facebook Graph API.

```javascript
/** @jsx React.DOM */

var Avatar = React.createClass({
  render: function() {
    return (
      <div>
        <ProfilePic username={this.props.username} />
        <ProfileLink username={this.props.username} />
      </div>
    );
  }
});

var ProfilePic = React.createClass({
  render: function() {
    return (
      <img src={'http://graph.facebook.com/' + this.props.username + '/picture'} />
    );
  }
});

var ProfileLink = React.createClass({
  render: function() {
    return (
      <a href={'http://www.facebook.com/' + this.props.username}>
        {this.props.username}
      </a>
    );
  }
});

React.renderComponent(
  <Avatar username="pwh" />,
  document.getElementById('example')
);
```

## Ownership

In the above example, instances of `Avatar` *own* instances of `ProfilePic` and `ProfileLink`. In React, **an owner is the component that sets the `props` of other components**. More formally, if a component `X` is created in component `Y`'s `render()` method, it is said that `X` is *owned by* `Y`. As discussed earlier, a component cannot mutate its `props` -- they are always consistent with what its owner sets them to. This key property leads to UIs that are guaranteed to be consistent.

It's important to draw a distinciton between the owner-ownee relationship and the parent-child relationship. The owner-ownee relationship is specific to React, while the parent-child relationship is simply the one you know and love from the DOM. In the example above, `Avatar` owns the `div`, `ProfilePic` and `ProfileLink` instances, and `div` is the **parent** (but not owner) of the `ProfilePic` and `ProfileLink` instances.

## Data flow

In React, data flows from owner to owned component through `props` as discussed above. This is effectively one-way data binding: owners bind their owned component's props to some value the owner has computed based on its `props` or `state`. Since this process happens recursively, data changes are automatically reflected everywhere they are used.

## A note on performance

You may be thinking that it's expensive to react to changing data if there are a large number of nodes under an owner. The good news is that JavaScript is fast and `render()` methods tend to be quite simple, so in most applications this is extremely fast. Additionally, the bottleneck is almost always the DOM mutation and not JS execution, and React will optimize this for you using batching and change detection.

However, sometimes you really want to have fine-grained control over your performance. In that case, simply override `shouldComponentUpdate()` to return false when you want React to skip processing of a subtree. See [the React API docs](./api.html) for more information.

**Note:** if `shouldComponentUpdate()` returns false when data has actually changed, React can't keep your UI in sync. Be sure you know what you're doing while using it, and only use this function when you have a noticeable performance problem. Don't underestimate how fast JavaScript is relative to the DOM.

## Build reusable component libraries!

When designing interfaces, break down the common design elements (buttons, form fields, layout components, etc) into reusable components with well-defined interfaces. That way, the next time you need to build some UI you can write much less code, which means faster development time, less bugs, and less bytes down the wire.

## Prop validation

As your app grows it's helpful to ensure that your components are used correctly. We do this using `propTypes`.

** TODO zpao **

## Mixins

Components are the best way to reuse code in React, but sometimes very different components may share some common functionality. These are sometimes called [cross-cutting concerns](http://en.wikipedia.org/wiki/Cross-cutting_concern). React provides `mixins` to solve this problem.

One common use case is a component wanting to update itself on a time interval. It's easy to use `setInterval()`, but it's important to cancel your interval when you don't need it anymore. React provides [lifecycle methods](./06-working-with-the-browser.html)