---
id: working-with-the-browser-zh-CN
title: 与浏览器协作
permalink: working-with-the-browser-zh-CN.html
prev: forms-zh-CN.html
next: more-about-refs-zh-CN.html
---

React 提供了强大的抽象机制使你在大多数情况下免于直接接触 DOM，但有时你仅仅只需要访问底层 API，也许是为了与第三方库或者已有的代码协作。

## 虚拟DOM

React 非常快速是因为它从不直接操作 DOM。React 维持了一个快速的内存中的 DOM 表示。`render()` 方法实际上返回一个对 DOM 的*描述*，然后 React 能根据内存中的“描述”来比较此“描述”以计算出最快速的方法更新浏览器。

此外，React 实现了一个完备的合成事件（synthetic event）系统，以使得所有的事件对象都被保证符合 W3C 细则，而不论各个浏览器的怪癖，并且所有事件跨浏览器地一致并高效的冒泡（bubbles），你甚至能在 IE8 里使用一些 HTML5 事件！

大多数时间你应该和 React 的"伪造浏览器"呆在一起，因为它更高性能并且容易推理。然而，有时你只需要访问底层 API，或许是为了与第三方库比如一个 jQuery 插件协作。React 为你提供了安全仓口来直接使用底层 API。

## Refs 和 findDOMNode()

为了与浏览器互动，你需要一个指向 DOM node 的引用。你可以连接一个 `ref` 到任何的元素，这允许你引用组件的 **backing instance**。它很有用，如果你需要在组件上调用命令式函数，或者想访问底层的 DOM 节点。要了解很多关于 refs，包括更有效使用他们的方法，请查看我们的[关于Refs的更多内容](/react/docs/more-about-refs-zh-CN.html)文档。

## 组件的生命周期

组件的生命周期有三个主要部分：

* **挂载:** 组件被注入DOM。
* **更新:** 组件被重新渲染来决定DOM是否应被更新。
* **卸载:** 组件从DOM中被移除。

React 提供生命周期方法，以便你可以指定钩挂到这个过程上。我们提供了 **will** 方法，该方法在某事发生前被调用，**did** 方法，在某事发生后被调用。

### 挂载

* `getInitialState(): object` 在组件挂载前被调用。有状态组件（Stateful components）应该实现此函数并返回初始 state 的数据。
* `componentWillMount()` 在挂载发生前被立即调用。
* `componentDidMount()` 在挂载发生后被立即调用。需要 DOM node 的初始化应该放在这里。

### 更新

* `componentWillReceiveProps(object nextProps)` 当挂载的组件接收到新的props时被调用。此方法应该被用于比较 `this.props` 和 `nextProps` 以用于使用 `this.setState()` 执行状态转换。
* `shouldComponentUpdate(object nextProps, object nextState): boolean` 当组件决定任何改变是否要更新到 DOM 时被调用。作为一个优化实现比较 `this.props` 和 `nextProps`、`this.state` 和 `nextState`，如果 React 应该跳过更新，返回 `false`。
* `componentWillUpdate(object nextProps, object nextState)` 在更新发生前被立即调用。你不能在此调用 `this.setState()`。
* `componentDidUpdate(object prevProps, object prevState)` 在更新发生后被立即调用。

### 卸载

* `componentWillUnmount()` 在组件被卸载和摧毁后被立即调用。清理应该放在这里。

### 已挂载的方法

_Mounted_ 复合组件同样支持以下方法：

* `component.forceUpdate()` 可以在任何已挂载的组件上调用，在你知道某些深处的组件状态被未使用 `this.setState()` 改变了时。

## 浏览器支持和填充物(polyfills)

在 Facebook，我们支持老浏览器，包括 IE8。我们由来已久的有适当的填充物（polyfills）来让我们写前瞻性的 js。这意味着我们在代码库中没有一堆散落在各处的技巧（hacks）并且我们依然能期望我们的代码"可行（just work）"。例如，我可以只写 `Date.now()`，而不是额外看到 `+new Date()`。既然开源的 React 和我们内部使用的一样，我们也应用了这种使用前瞻性 js 的哲学。

除了这种哲学外，我们也采用了这样的立场，我们，作为一个 JS 库的作者，不应该把 polyfills 作为我们库的一部分。如果所有的库这样做，就有很大的机会发送同样的 polyfill 多次，这可能是一个相当大的无用代码。如果你的产品需要支援老的浏览器，你很有可能已经在使用某些东西比如 [es5-shim](https://github.com/es-shims/es5-shim)。

### 需要用来支持旧浏览器的Polyfills

来自 [kriskowal's es5-shim](https://github.com/es-shims/es5-shim) 的 `es5-shim.js` 提供了如下 React 需要的东西：

* `Array.isArray`
* `Array.prototype.every`
* `Array.prototype.forEach`
* `Array.prototype.indexOf`
* `Array.prototype.map`
* `Date.now`
* `Function.prototype.bind`
* `Object.keys`
* `String.prototype.split`
* `String.prototype.trim`

同样来自 [kriskowal's es5-shim](https://github.com/es-shims/es5-shim) 的 `es5-sham.js`, 提供了如下 React 需要的东西：

* `Object.create`
* `Object.freeze`

非最小化的 React build 需要如下，来自 [paulmillr's console-polyfill](https://github.com/paulmillr/console-polyfill)。

* `console.*`

当在 IE8 里使用 HTML5 元素，包括`<section>`、`<article>`、`<nav>`、`<header>` 和 `<footer>`, 同样必须包含 [html5shiv](https://github.com/aFarkas/html5shiv) 或者类似的脚本。

### 跨浏览器问题

尽管 React 在抽象浏览器不同时做的相当好，但一些浏览器被限制或者表现出怪异的行为，我们没能找到变通的方案解决。

#### IE8的onScroll事件

在 IE8 `onScroll` 事件不冒泡，并且 IE8 没有定义事件捕获阶段 handlers 的 API，意味 React 这没有办法去监听这些事件。
目前这个事件的 handler 在 IE8 中是被忽略的。

参见 [onScroll doesn't work in IE8](https://github.com/facebook/react/issues/631) GitHub问题来获得更多信息.
