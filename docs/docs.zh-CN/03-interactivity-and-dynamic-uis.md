---
id: interactivity-and-dynamic-uis
title: 交互动态UI
layout: docs.zh-CN
permalink: interactivity-and-dynamic-uis.html
prev: jsx-gotchas.html
next: multiple-components.html
---

你已经学会了[如何通过React展示数据](/react/docs.zh-CN/displaying-data.html)。现在让我们来看下如何来使这些用户界面产生交互。

## 一个简单的例子

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

React.render(
  <LikeButton />,
  document.getElementById('example')
);
```


## 事件处理和生成事件

通过React你只需将你的事件句柄在一般的HTML中的驼峰式属性赋值即可。React会确保所有事件行和IE8及以上所实现的事件体系保持一致。也就是说，React知道如何执行事件冒泡，并根据规范进行事件捕获，并传递给你的事件句柄的事件都保证与[W3C规范](http://www.w3.org/TR/DOM-Level-3-Events/)保持一致，不管你使用哪种浏览器。

如果你想要在手机或平板这样的触屏设备上使用React，简单的调用`React.initializeTouchEvents(true);`开启触屏事件处理。


## 内部机制: 自动绑定和事件委托

 React在内部做了一些事情让您的代码，高性能和易于理解.

**自动绑定:** 当在JavaScript中创建一个回调时, 你通常需要确保绑定事件实例到方法到`this`的值是正确的。有了React，每一个方法是自动绑定到其组件实例。反应缓存绑定的方式，使得它非常CPU和内存使用效率。这也是少输入代码！

**事件委托:** React 实际上并不添加事件句柄到到节点本身上. 当React启动时，就开始使用使用一个单一的事件监听器在顶层监听所有事件。当一个组件挂载或卸载，该事件句柄简单地从内部映射添加或删除。当事件触发时，React知道如何使用这个映射调度它。当留在映射中没有事件句柄，React事件句柄只是简单的空操作。要了解更多为什么这么快，查看[David Walshde优秀的博客文章](http://davidwalsh.name/event-delegate)。

## 组件只是状态机

React认为界面是简单状态机。通过UI是作为不同的状态和渲染这些状态的存在这种思想，这样很容易让你的UI保持一致。

在React中，您只需更新组件的状态，然后渲染基于此新状态的新UI。React以最有效的方式处理需要更新的DOM。


## 状态是如何运作的

在React中，一种通用的修改状态的方式是调用`setState(data, callback)`。这个方法会合并`data`到`this.state`和重新渲染这个组件。当这个组件被完成重新渲染,这个可选项`callback`会被调用。大多数时间你不需要设置`callback`,因为React会保持你的UI和状态更新一致。


## 什么组件需要有状态?

大部分的组件应该简单地从`props`获取一些数据和渲染这个组件。不过，有时你需要用户输入，服务器请求或随着时间的变化。为此你需要使用状态。

**尽量保持尽可能多的组件尽可能无状态。** 这么做你可以分离状态，使其用于合乎逻辑的地方并最小化冗余，让状态在你的应用中更容易理解。


一个常见的方式是创建一个只渲染数据的几个无状态的组件，并在其之上建立层级结构，通过父级的状态组件在通过`props`传递其状态到子级。有状态的组件封装了所有的交互逻辑，而无状态的组件需要关注以声明的方式渲染数据即可。


## 什么*应该*使用状态？

**状态应该包含一个组件的事件句柄几种触发UI更新改变的数据**在真实的应用中这些数据是非常小的和JSON序列化的。当创建一个状态组件，想想其状态的最小可能的表示，并只存储这些属性到`this.state`。在`render()`内部计算那些你需要基于状态的信息。你会发现，用这种方式思考和编写应用程序往往导致最佳的应用程序，因为添加冗余或计算值的状态意味着你需要明确保持同步，而不是依赖于React计算这些。

## 什么*不应该*使用状态？

`this.state`应该只包含那些最小数量你的UI需要展现的状态。如，不该包含的：

* **计算出来的值:** 不用担心基于状态预先计算的值 - 如果你在做`render()`所有的计算，那将更容易，渲染会确保您的UI是一致的。如，你有一个状态列表的数字需要在渲染中以字符串的形式展示列表长度，简单的将`this.state.listItems.length + ' list items'` 在你的`render()`方法渲染而不是在`this.state`中存储。
* **React组件:** 创建这些在`render()`中基于底层属性和状态。
* **从props复制出来的值:** 尝试使用属性尽可能获取其所在的来源。在一个状态中有效利用存储属性是可以知道这是以前的值，因为属性可以随时间而改变。
