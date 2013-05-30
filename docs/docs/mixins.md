---
id: docs-mixins
title: Mixins
layout: docs
prev: api.html
---

Mixins allow code to be shared between multiple React components. They're pretty similar to mixins in Python or traits in PHP. Let's look at a simple example:

```javascript
// mixins-simple.js
var MyMixin = {
  getMessage: function() {
    return 'hello world';
  }
};

var MyComponent = React.createClass({
  mixins: [MyMixin],
  render: function() {
    return <div>{this.getMessage()}</div>;
  }
});
```

A class can use multiple mixins. Multiple mixins can also override any of the lifecycle methods and they'll be called for each mixin. Here's an example:

```javascript
// mixins-advanced.js
var Mixin1 = {
  componentDidMount: function() {
    console.log('Mixin1.componentDidMount()');
  }
};

var Mixin2 = {
  componentDidMount: function() {
    console.log('Mixin2.componentDidMount()');
  }
};


var MyComponent = React.createClass({
  mixins: [Mixin1, Mixin2],
  render: function() {
    return <div>hello world</div>;
  }
});
```

When MyComponent is mounted in the page the following text will print to the console:

```
Mixin1.componentDidMount()
Mixin2.componentDidMount()
```

## When should you use mixins?

In general, add a mixin whenever you want a component to share some utility methods, public interface, or lifecycle behavior. Often it's appropriate to use them as you would use a superclass in another OOP language.
