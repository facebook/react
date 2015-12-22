---
id: interactivity-and-dynamic-uis-zh-CN
title: 动态交互式用户界面
permalink: interactivity-and-dynamic-uis-zh-CN.html
prev: jsx-gotchas-zh-CN.html
next: multiple-components-zh-CN.html
---

我们已经学习如何使用 React [显示数据](/react/docs/displaying-data-zh-CN.html)。现在让我们来学习如何创建交互式界面。

## 简单例子

```javascript
var LikeButton = React.createClass({
  getInitialState: function() {
    return {liked: false};
  },
  handleClick: function(event) {
    this.setState({liked: !this.state.liked});
  },
  render: function() {
    var text = this.state.liked ? 'like' : 'haven\'t liked';
    return (
      <p onClick={this.handleClick}>
        You {text} this. Click to toggle.
      </p>
    );
  }
});

ReactDOM.render(
  <LikeButton />,
  document.getElementById('example')
);
```

## 事件处理与合成事件（Synthetic Events）

React 里只需把事件处理器（event handler）以骆峰命名（camelCased）形式当作组件的 props 传入即可，就像使用普通 HTML 那样。React 内部创建一套合成事件系统来使所有事件在 IE8 和以上浏览器表现一致。也就是说，React 知道如何冒泡和捕获事件，而且你的事件处理器接收到的 events 参数与 [W3C 规范](http://www.w3.org/TR/DOM-Level-3-Events/) 一致，无论你使用哪种浏览器。

## 幕后原理：自动绑定（Autobinding）和事件代理（Event Delegation）

在幕后，React 做了一些操作来让代码高效运行且易于理解。

**Autobinding:** 在 JavaScript 里创建回调的时候，为了保证 `this` 的正确性，一般都需要显式地绑定方法到它的实例上。在 React，所有方法被自动绑定到了它的组件实例上（除非使用ES6的class符号）。React 还缓存这些绑定方法，所以 CPU 和内存都是非常高效。而且还能减少打字！

**事件代理 ：** React 实际并没有把事件处理器绑定到节点本身。当 React 启动的时候，它在最外层使用唯一一个事件监听器处理所有事件。当组件被加载和卸载时，只是在内部映射里添加或删除事件处理器。当事件触发，React 根据映射来决定如何分发。当映射里处理器时，会当作空操作处理。参考 [David Walsh 很棒的文章](http://davidwalsh.name/event-delegate) 了解这样做高效的原因。

## 组件其实是状态机（State Machines）

React 把用户界面当作简单状态机。把用户界面想像成拥有不同状态然后渲染这些状态，可以轻松让用户界面和数据保持一致。

React 里，只需更新组件的 state，然后根据新的 state 重新渲染用户界面（不要操作 DOM）。React 来决定如何最高效地更新 DOM。

## State 工作原理

常用的通知 React 数据变化的方法是调用 `setState(data, callback)`。这个方法会合并（merge） `data` 到 `this.state`，并重新渲染组件。渲染完成后，调用可选的 `callback` 回调。大部分情况下不需要提供 `callback`，因为 React 会负责把界面更新到最新状态。

## 哪些组件应该有 State？

大部分组件的工作应该是从 `props` 里取数据并渲染出来。但是，有时需要对用户输入、服务器请求或者时间变化等作出响应，这时才需要使用 State。

** 尝试把尽可能多的组件无状态化。** 这样做能隔离 state，把它放到最合理的地方，也能减少冗余并，同时易于解释程序运作过程。

常用的模式是创建多个只负责渲染数据的无状态（stateless）组件，在它们的上层创建一个有状态（stateful）组件并把它的状态通过 `props` 传给子级。这个有状态的组件封装了所有用户的交互逻辑，而这些无状态组件则负责声明式地渲染数据。

## 哪些 *应该* 作为 State？

**State 应该包括那些可能被组件的事件处理器改变并触发用户界面更新的数据。** 真实的应用中这种数据一般都很小且能被 JSON 序列化。当创建一个状态化的组件时，想象一下表示它的状态最少需要哪些数据，并只把这些数据存入 `this.state`。在 `render()` 里再根据 state 来计算你需要的其它数据。你会发现以这种方式思考和开发程序最终往往是正确的，因为如果在 state 里添加冗余数据或计算所得数据，需要你经常手动保持数据同步，不能让 React 来帮你处理。

## 哪些 *不应该* 作为 State？

`this.state` 应该仅包括能表示用户界面状态所需的最少数据。因些，它不应该包括：

* **计算所得数据：** 不要担心根据 state 来预先计算数据 —— 把所有的计算都放到 `render()` 里更容易保证用户界面和数据的一致性。例如，在 state 里有一个数组（listItems），我们要把数组长度渲染成字符串， 直接在 `render()` 里使用 `this.state.listItems.length + ' list items'` 比把它放到 state 里好的多。
* **React 组件：** 在 `render()` 里使用当前 props 和 state 来创建它。
* **基于 props 的重复数据：** 尽可能使用 props 来作为实际状态的源。把 props 保存到 state 的一个有效的场景是需要知道它以前值的时候，因为 props 可能因为父组件重绘的结果而变化。
