---
id: expose-component-functions
title: Expose Component Functions
layout: tips
permalink: expose-component-functions.html
prev: communicate-between-components.html
next: references-to-components.html
---

There's another (uncommon) way of [communicating between components](/react/tips/communicate-between-components.html): simply expose a method on the child component for the parent to call.

Say a list of todos, which upon clicking get removed. If there's only one unfinished todo left, animate it:

```js
var Todo = React.createClass({
  render: function() {
    return <div onClick={this.props.onClick}>{this.props.title}</div>;
  },

  //this component will be accessed by the parent through the `ref` attribute
  animate: function() {
    console.log('Pretend %s is animating', this.props.title);
  }
});

var Todos = React.createClass({
  getInitialState: function() {
    return {items: ['Apple', 'Banana', 'Cranberry']};
  },

  handleClick: function(index) {
    var items = this.state.items.filter(function(item, i) {
      return index !== i;
    });
    this.setState({items: items}, function() {
      if (items.length === 1) {
        this.refs.item0.animate();
      }
    }.bind(this));
  },

  render: function() {
    return (
      <div>
        {this.state.items.map(function(item, i) {
          var boundClick = this.handleClick.bind(this, i);
          return (
            <Todo onClick={boundClick} key={i} title={item} ref={'item' + i} />
          );
        }, this)}
      </div>
    );
  }
});

React.render(<Todos />, mountNode);
```

Alternatively, you could have achieved this by passing the `todo` an `isLastUnfinishedItem` prop, let it check this prop in `componentDidUpdate`, then animate itself; however, this quickly gets messy if you pass around different props to control animations.
