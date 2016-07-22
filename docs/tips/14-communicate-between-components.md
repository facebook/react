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
Say your `GroceryList` component has a list of items generated through an array. When a list item is clicked, you want to display its name:

```js
var handleClick = function(i, props) {
  console.log('You clicked: ' + props.items[i]);
}

function GroceryList(props) {  
  return (
    <div>
      {props.items.map(function(item, i) {
        return (
          <div onClick={handleClick.bind(this, i, props)} key={i}>{item}</div>
        );
      })}
    </div>
  );
}

ReactDOM.render(
  <GroceryList items={['Apple', 'Banana', 'Cranberry']} />, mountNode
);
```

Notice the use of `bind(this, arg1, arg2, ...)`: we're simply passing more arguments to `handleClick`. This is not a new React concept; it's just JavaScript.

For communication between two components that don't have a parent-child relationship, you can set up your own global event system. Subscribe to events in `componentDidMount()`, unsubscribe in `componentWillUnmount()`, and call `setState()` when you receive an event. [Flux](https://facebook.github.io/flux/) pattern is one of the possible ways to arrange this.
