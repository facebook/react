---
id: communicate-between-components
title: Communicate Between Components
layout: tips
permalink: tips/communicate-between-components.html
prev: false-in-jsx.html
next: expose-component-functions.html
---

For parent-child communication, simply [pass props](/react/docs/multiple-components.html).

For child-parent communication:
Say your `GroceryList` component has a list of `Item`s generated through an array. When a list item is clicked, you want to display its name:

```js
var GroceryList = React.createClass({
  show: function(e) {
    console.log(e);
  },
  render: function() {
    return (
      <div>
        {this.props.items.map((item, index) => {
          return <Item key={index} value={item} log={this.show} />
        })}
      </div>
    );
  }
})

var Item = React.createClass({
  handleClick: function(e) {
    this.props.log(this.props.value);
  },
  render: function() {
    return (
      <div onClick={this.handleClick}>{this.props.value}</div>
    );
  }
})

ReactDOM.render(
  <GroceryList items={['Apple', 'Banana', 'Cranberry']} />, mountNode
);
```

Notice the use of the arrow function `=>`: we're ensuring `this` inside the `map()` call refers to the `GroceryList` component. This is not a new React concept; it's just JavaScript.

For communication between two components that don't have a parent-child relationship, you can set up your own global event system. Subscribe to events in `componentDidMount()`, unsubscribe in `componentWillUnmount()`, and call `setState()` when you receive an event. [Flux](https://facebook.github.io/flux/) pattern is one of the possible ways to arrange this.
