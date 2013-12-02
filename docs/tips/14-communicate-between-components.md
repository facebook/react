---
id: communicate-between-components
title: Communicate Between Components
layout: tips
permalink: communicate-between-components.html
prev: false-in-jsx.html
---

For parent-child communication, simply [pass props](/react/docs/multiple-components.html).

For child-parent communication:
Say your `GroceryList` component has a list of items generated through an array. When a list item is clicked, you want to display its name:

```js
/** @jsx React.DOM */

var GroceryList = React.createClass({
  handleClick: function(i) {
    console.log('You clicked: ' + this.props.items[i]);
  },
  
  render: function() {
    return (
      <div>
        {this.props.items.map(function(item, i) {
          return (
            <div onClick={this.handleClick.bind(this, i)} key={i}>{item}</div>
          );
        }, this)}  
      </div>
    );
  }
});

React.renderComponent(
  <GroceryList items={['Apple', 'Banana', 'Cranberry']} />, mountNode
);
```

Notice the use of `bind(this, arg1, arg2, ...)`: we're simply passing more arguments to `handleClick`. This is not a new React concept; it's just JavaScript.
