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
var handleClick = function(i, items) {
  console.log('You clicked: ' + items[i]);
}

function GroceryList(props) {  
  return (
    <div>
      {props.items.map(function(item, i) {
        return (
          <div onClick={handleClick.bind(this, i, props.items)} key={i}>{item}</div>
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


For communication between two components that don't have a parent-child relationship, you can set up your own global event system. Subscribe to events in `componentDidMount()`, unsubscribe in `componentWillUnmount()`, and when you receive an event, call `setState()`.


For communication between components that share a sibling relationship:

Let's say your `Dashboard` component has two child components `ControlPanel` and `Graph` (both are siblings). When a button in `ControlPanel` is clicked, you want to send some data from `ControlPanel` to `Graph`, so that you may re-render the graph based on this data. This can be achieved in the following manner:

```js
var Control = React.createClass({
  sendData: function(data) {
    this.props.resetGraph(data);
  },
  render: function() {
    return (
      <div>
        <button id="buttonOne" onClick={this.sendData.bind(this, 'one')} >
          Button One
        </button>

        <button id="buttonOne" onClick={this.sendData.bind(this, 'two')} >
          Button two
        </button>
      </div>
    );
  }
});

var Graph = React.createClass({
  getInitialState: function() {
    return {
      data: ''
    }  
  },
  setGraphValue: function(data) {
    this.setState({
      data: data
    });
  },
  render: function() {
    return (
      <div>
        {this.state.data}
      </div>
    );
  }
});

var Dashboard = React.createClass({
  resetGraph: function(data) {
    this.refs.mygraph.setGraphValue(data);
  },
  render: function() {
    return (
      <div>
        <Control resetGraph={this.resetGraph} />
        <Graph ref="mygraph" />
      </div>
    );
  }
});

```


Notice that we have assigned the `Graph` component a unique `ref` property. In `ControlPanel`, clicking on one of the buttons passes a string data to the `sendData` method, which then in turn passes it to the `resetGraph` method in `Dashboard`, through `props`. Now `resetGraph` calls a method `setGraphValue` defined within `Graph` using the `ref` attribute assigned to it, by doing `this.props.mygraph.setGraphValue` and passing data to it. `setGraphValue` calls `setState()` which re-renders the `Graph` component based on the received data. 

This approach can be used when you have a fairly large DOM tree containing many child components, which in turn may contain child components. In such a case, calling `setState()` on the parent would make React perform the re-rendering process on all of the child components, which might not be necessary. Using this approach would avoid the reconciling process on all subtrees of the component, rendering only the necessary ones.