---
title: "Introducing React Elements"
author: Sebastian Markbåge
redirect_from: "blog/2014/10/14/introducting-react-elements.html"
---

The upcoming React 0.12 tweaks some APIs to get us close to the final 1.0 API. This release is all about setting us up for making the `ReactElement` type really FAST, [jest unit testing](http://facebook.github.io/jest/) easier, making classes simpler (in preparation for ES6 classes) and better integration with third-party languages!

If you currently use JSX everywhere, you don't really have to do anything to get these benefits! The updated transformer will do it for you.

If you can't or don't want to use JSX, then please insert some hints for us. Add a `React.createFactory` call around your imported class when you require it:

```javascript
var MyComponent = React.createFactory(require('MyComponent'));
```

Everything is backwards compatible for now, and as always React will provide you with descriptive console messaging to help you upgrade.

`ReactElement` is the primary API of React. Making it faster has shown to give us several times faster renders on common benchmarks. The API tweaks in this release helps us get there.

Continue reading if you want all the nitty gritty details...


## New Terminology

We wanted to make it easier for new users to see the parallel with the DOM (and why React is different). To align our terminology we now use the term `ReactElement` instead of _descriptor_. Likewise, we use the term `ReactNode` instead of _renderable_.

[See the full React terminology guide.](https://gist.github.com/sebmarkbage/fcb1b6ab493b0c77d589)

## Creating a ReactElement

We now expose an external API for programmatically creating a `ReactElement` object.

```javascript
var reactElement = React.createElement(type, props, children);
```

The `type` argument is either a string (HTML tag) or a class. It's a description of what tag/class is going to be rendered and what props it will contain. You can also create factory functions for specific types. This basically just provides the type argument for you:

```javascript
var div = React.createFactory('div');
var reactDivElement = div(props, children);
```


## Deprecated: Auto-generated Factories

Imagine if `React.createClass` was just a plain JavaScript class. If you call a class as a plain function you would call the component's constructor to create a Component instance, not a `ReactElement`:

```javascript
new MyComponent(); // Component, not ReactElement
```

React 0.11 gave you a factory function for free when you called `React.createClass`. This wrapped your internal class and then returned a `ReactElement` factory function for you.

```javascript
var MyComponent = React.createFactory(
  class {
    render() {
      ...
    }
  }
);
```

In future versions of React, we want to be able to support pure classes without any special React dependencies. To prepare for that we're [deprecating the auto-generated factory](https://gist.github.com/sebmarkbage/d7bce729f38730399d28).

This is the biggest change to 0.12. Don't worry though. This functionality continues to work the same for this release, it just warns you if you're using a deprecated API. That way you can upgrade piece-by-piece instead of everything at once.


## Upgrading to 0.12

### React With JSX

If you use the React specific [JSX](http://facebook.github.io/jsx/) transform, the upgrade path is simple. Just make sure you have React in scope.

```javascript
// If you use node/browserify modules make sure
// that you require React into scope.
var React = require('react');
```

React's JSX will create the `ReactElement` for you. You can continue to use JSX with regular classes:

```javascript
var MyComponent = React.createClass(...);

var MyOtherComponent = React.createClass({
  render: function() {
    return <MyComponent prop="value" />;
  }
});
```

*NOTE: React's JSX will not call arbitrary functions in future releases. This restriction is introduced so that it's easier to reason about the output of JSX by both the reader of your code and optimizing compilers. The JSX syntax is not tied to React. Just the transpiler. You can still use [the JSX spec](http://facebook.github.io/jsx/) with a different transpiler for custom purposes.*

### React Without JSX

If you don't use JSX and just call components as functions, you will need to explicitly create a factory before calling it:

```javascript
var MyComponentClass = React.createClass(...);

var MyComponent = React.createFactory(MyComponentClass); // New step

var MyOtherComponent = React.createClass({
  render: function() {
    return MyComponent({ prop: 'value' });
  }
});
```

If you're using a module system, the recommended solution is to export the class and create the factory on the requiring side.

Your class creation is done just like before:

```javascript
// MyComponent.js
var React = require('react');
var MyComponent = React.createClass(...);
module.exports = MyComponent;
```

The other side uses `React.createFactory` after `require`ing the component class:

```javascript
// MyOtherComponent.js
var React = require('react');
// All you have to do to upgrade is wrap your requires like this:
var MyComponent = React.createFactory(require('MyComponent'));

var MyOtherComponent = React.createClass({
  render: function() {
    return MyComponent({ prop: 'value' });
  }
});

module.exports = MyOtherComponent;
```

You ONLY have to do this for custom classes. React still has built-in factories for common HTML elements.

```javascript
var MyDOMComponent = React.createClass({
  render: function() {
    return React.DOM.div({ className: 'foo' }); // still ok
  }
});
```

We realize that this is noisy. At least it's on the top of the file (out of sight, out of mind). This a tradeoff we had to make to get [the other benefits](https://gist.github.com/sebmarkbage/d7bce729f38730399d28) that this model unlocks.

### Anti-Pattern: Exporting Factories

If you have an isolated project that only you use, then you could create a helper that creates both the class and the factory at once:

```javascript
// Anti-pattern - Please, don't use
function createClass(spec) {
  return React.createFactory(React.createClass(spec));
}
```

This makes your components incompatible with jest testing, consumers using JSX, third-party languages that implement their own optimized `ReactElement` creation, etc.

It also encourages you to put more logic into these helper functions. Something that another language, a compiler or a reader of your code couldn't reason about.

To fit into the React ecosystem we recommend that you always export pure classes from your shared modules and let the consumer decide the best strategy for generating `ReactElement`s.


## Third-party Languages

The signature of a `ReactElement` is something like this:

```javascript
{
  type : string | class,
  props : { children, className, etc. },
  key : string | boolean | number | null,
  ref : string | null
}
```

Languages with static typing that don't need validation (e.g. [Om in ClojureScript](https://github.com/swannodette/om)), and production level compilers will be able to generate these objects inline instead of going through the validation step. This optimization will allow significant performance improvements in React.


## Your Thoughts and Ideas

We'd love to hear your feedback on this API and your preferred style. A plausible alternative could be to directly inline objects instead of creating factory functions:

```javascript
// MyOtherComponent.js
var React = require('react');
var MyComponent = require('MyComponent');

var MyOtherComponent = React.createClass({
  render: function() {
    return { type: MyComponent, props: { prop: 'value' } };
  }
});

module.exports = MyOtherComponent;
```

This moves the noise down into the render method though. It also doesn't provide a hook for dynamic validation/type checking so you'll need some other way to verify that it's safe.

*NOTE: This won't work in this version of React because it's conflicting with other legacy APIs that we're deprecating. (We temporarily add a `element._isReactElement = true` marker on the object.)*


## The Next Step: ES6 Classes

After 0.12 we'll begin work on moving to ES6 classes. We will still support `React.createClass` as a backwards compatible API. If you use an ES6 transpiler you will be able to declare your components like this:

```javascript
export class MyComponent {
  render() {
    ...
  }
};
```

This upcoming release is a stepping stone to make it as easy as this. Thanks for your support.
