---
title: "Standards are the Future"
author: jimfb
---

Historically, popular frameworks had to build their own class systems, because Javascript didn’t have a built-in class system.  Starting in React v0.13, we announced that we would be switching to standard Javascript constructs.  We began supporting javascript classes before the standard `class` specification was even officially finalized.  In June of last year, the Javascript standards committee approved ES2015, which officially added classes to the Javascript language specification.  If you haven’t already started transitioning away from `React.createClass`, now is the time!  We are officially classifying `React.createClass` as legacy, and recommending that people move toward standard constructs like functions and classes.

## ES6 Classes
ES6 Classes, also known as “ES2015 Classes” or “Javascript Classes”, are the newly-introduced javascript standard for representing classes.  React components can be defined using standard classes, instead of using `React.createClass`.

A React component defined using the class syntax looks like this:

```js
class MyComponent extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <div>Hello {this.props.name}</div>;
  }
  componentDidMount() {
    // we can override a lifecycle method.
  }
  componentDidUpdate() {
    // we can override another lifecycle method.
  }
}
```

As you can see, a component defined using a native javascript class is fairly similar to a component using the old `createClass` syntax.  You can still override the same lifecycle methods, you can still access `this.props` and `this.state`, etc.

However, there are a few differences.  For instance, the `isMounted` method no longer exists ([isMounted was an antipattern anyway](/react/blog/2015/12/16/ismounted-antipattern.html)), mixins are no longer supported (having been [replaced by composition](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750#.8552ezwh9)), etc.

You can get an overview of the differences in our [React 0.13-beta blog post](/react/blog/2015/01/27/react-v0.13.0-beta-1.html) and our [Reusable Components documentation](/react/docs/reusable-components.html#es6-classes).  If you are migrating your existing codebase from `createClass` to standard javascript classes, you might find [Kris Jordan’s Migration Guide](http://www.newmediacampaigns.com/blog/refactoring-react-components-to-es6-classes) helpful.

## Stateless Functional Components
If your components are stateless and functional (ideally, most of your components should be), then you can define your component as a simple function.  A Stateless Functional Component (sometimes referred to as an “SFC” on the internet), is just a render function that takes in props and returns JSX.

An example component looks like this:

```js
function MyComponent(props) {
  return <div>Hello {props.name}!</div>
}
```

Stateless functional components are a convenient syntax for lightweight components.  They can also be optimized within the React core to follow slightly faster code paths and use less memory.  However, they don’t have a backing instance, so you can’t attach a ref to the component, and there is no `this` object upon which to store internal state.

You can read more about Stateless Functional Components in our [Reusable Components documentation](/react/docs/reusable-components.html#stateless-functions)

## The future of React.createClass()
An interesting fact about `React.createClass()` is that it can be implemented entirely in userland, because an ES6 class is just an object with the proper prototype set.  This means that even when `React.createClass()` is eventually removed from the core, it would still be possible to release an implementation of `React.createClass()` as a separate standalone library.  If you are not using a transpiler, or you just love your autobinding and mixins, this is a viable strategy.



