---
id: expose-component-functions-zh-CN
title: 暴露组件函数
layout: tips
permalink: tips/expose-component-functions-zh-CN.html
prev: communicate-between-components-zh-CN.html
next: children-undefined-zh-CN.html
---


这是另外一种组件[通信的方法](/react/tips/communicate-between-components.html)：在子组件中暴露出一个方法，可以让父组件去调。

让我们看看这个todos的列表，在点击的时候就会被移除。如果只剩下最后一个未完成的待办事项，就执行animate函数：

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

ReactDOM.render(<Todos />, mountNode);
```

当然，你也可以通过在`todo`组件中的prop传递`isLastUnfinishedItem`，来让子组件在 `componentDidUpdate`中判断是否它是最后一个，来执行animate函数；但是，如果你通过不同的props值来控制的不同的动画，到最后可能会变得很混乱。