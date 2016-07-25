---
id: working-with-the-browser-zh-CN
title: 与浏览器协作
permalink: docs/working-with-the-browser-zh-CN.html
prev: forms-zh-CN.html
next: more-about-refs-zh-CN.html
---

React提供了强大的抽象机制使你在大多数情况下免于直接接触DOM，但有时你仅仅只需要访问底层API，也许是为了与第三方库或者已有的代码协作。

## 虚拟 DOM

React非常快速是因为它从不直接操作DOM。React维持了一个快速的内存中的DOM表示。`render()` 方法实际上返回一个对DOM的*描述*，然后React能将其与内存中的“描述”进行比较，以计算出最快速的方式更新浏览器。

此外，React实现了一个完备的合成事件（synthetic event）系统，以使得所有的事件对象都被保证符合W3C细则，而不论各个浏览器的怪癖，并且所有事件跨浏览器地一致并高效的冒泡（bubbles），你甚至能在IE8里使用一些HTML5事件！

大多数时间你应该和React的"伪造浏览器"呆在一起，因为它更高性能并且容易推理。然而，有时你只需要访问底层API，或许是为了与第三方库比如一个jQuery插件协作。React为你提供了安全舱口来直接使用底层API。

## Refs 和 findDOMNode()

为了与浏览器互动，你需要一个指向DOM node的引用。你可以连接一个 `ref` 到任何的元素，这允许你引用组件的 **backing instance**  。如果你需要在组件上调用命令式函数，或者想访问底层的DOM节点，它很有用。要了解更多关于 refs，包括更有效使用他们的方法，请查看我们的 [关于Refs的更多内容](/react/docs/more-about-refs-zh-CN.html) 文档。

## 组件的生命周期

组件的生命周期有三个主要部分：

* **挂载:** 组件被注入DOM。
* **更新:** 组件被重新渲染来决定DOM是否应被更新。
* **卸载:** 组件从DOM中被移除。

React提供生命周期方法，以便你可以指定钩挂到这个过程上。我们提供了 **will** 方法，该方法在某事发生前被调用，**did**方法，在某事发生后被调用。

### 挂载

* `getInitialState(): object` 在组件挂载前被调用。有状态组件(Stateful components) 应该实现此函数并返回初始state的数据。
* `componentWillMount()` 在挂载发生前被立即调用。
* `componentDidMount()` 在挂载发生后被立即调用。 需要DOM node的初始化应该放在这里。

### 更新

* `componentWillReceiveProps(object nextProps)` 当挂载的组件接收到新的props时被调用。此方法应该被用于比较`this.props` 和 `nextProps`以用于使用`this.setState()`执行状态转换。
* `shouldComponentUpdate(object nextProps, object nextState): boolean` 当组件决定任何改变是否要更新到DOM时被调用。作为一个优化实现比较`this.props` 和 `nextProps` 、`this.state` 和 `nextState` ，如果React应该跳过更新，返回`false`。
* `componentWillUpdate(object nextProps, object nextState)` 在更新发生前被立即调用。你不能在此调用`this.setState()`。
* `componentDidUpdate(object prevProps, object prevState)` 在更新发生后被立即调用。

### 卸载

* `componentWillUnmount()` 在组件被卸载和摧毁前被立即调用。清理应该放在这里。

### 已挂载的方法

_Mounted_ 复合组件同样支持以下方法:

* `component.forceUpdate()` 可以在任何已挂载的组件上调用，在你知道某些深处的组件状态在未使用 `this.setState()` 就被改变了时。

## 浏览器支持

React 支持绝大多数流行的浏览器，包括 Internet Explorer 9 及以上。

（我们不支持那些不支持 ES5 methods 的更老的浏览器，但你可能发现如果你的页面包含了类似 [es5-shim and es5-sham](https://github.com/es-shims/es5-shim) 的填充物时是可以在更老的浏览器上运行的。是否做这一步取决于你自己。）
