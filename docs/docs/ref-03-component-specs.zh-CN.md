---
id: component-specs-zh-CN
title: 组件的规范和生命周期
permalink: docs/component-specs-zh-CN.html
prev: component-api-zh-CN.html
next: tags-and-attributes-zh-CN.html
---

## 组件规范(Specifications)

当调用 `React.createClass()` 创建一个组件类时,你应该提供一个包含有 `render` 方法以及可选的其他生命周期方法的 规范(Specifications)对象.

> 注意:
> 
> 同样可以使用单纯的 JavaScript 类作为组件类. 这些类可以实现大多数相同的方法,虽然有一些不同.更多关于不同的信息,请阅读我们关于[ES6 classes](/react/docs/reusable-components.html#es6-classes)的文档.

### render

```javascript
ReactElement render()
```

 `render()` 是必须的
 
 当被调用时,它应该检查 `this.props` 和 `this.state` 并返回单个子元素.这个子元素即可以是一个 对原生DOM的虚拟表达(比如 `<div />` 或 `React.DOM.div()`)也可以是其他你自定义的复合组件.
 
 你也可以返回 `null` 或 `false` 来指示你不想要任何东西被渲染.幕后,React 渲染一个 `<noscript>` tag 来与我们当前的diffing算法协同工作.当返回 `null` 或 `false` ,`ReactDOM.findDOMNode(this)` 会返回 `null`.
 
 `render()` 函数应该是纯净的,意味着它不改变组件的状态,它在每次调用时返回相同的结果,并且它不读和写 DOM 或者其他方式与浏览器互动(例如,使用 `setTimeout`).如果你需要与浏览器互动,在 `componentDidMount()` 里执行你的工作,或者其他生命周期方法里.保持 `render()` 纯净使服务器渲染更实用并且让组件更容易被思考.
 
 
 ### getInitialState
 
 ```javascript
object getInitialState()
```

当组件被挂载时调用一次.返回值会被用作为 `this.state` 的初始值.


### getDefaultProps

```javascript
object getDefaultProps()
```

在类被创建时调用一次并被缓存.在这个mapping里的值会被设置给 `this.props` 如果父组件没有指定对应的 prop (例如 使用一个 `in` 检查).

这个方法在任何实例被创建之前调用,因此不能依赖于 `this.props`.另外,小心,任何被 `getDefaultProps()`返回的复杂对象会被跨实例共享,而不是被拷贝.


### propTypes

```javascript
object propTypes
```

 `propTypes` 对象允许你验证传递到你的组建的 props.更多关于 `propTypes` 的信息,见 [Reusable Components](/react/docs/reusable-components.html).


### mixins

```javascript
array mixins
```

 `mixins` 数组允许你用 mixins 来在多个组件间共享行为.更多关于 mixins 的信息,见 [Reusable Components](/react/docs/reusable-components.html).


### statics

```javascript
object statics
```

`statics` 对象允许你定义可以在组件类上调用的静态方法.例如:

```javascript
var MyComponent = React.createClass({
  statics: {
    customMethod: function(foo) {
      return foo === 'bar';
    }
  },
  render: function() {
  }
});

MyComponent.customMethod('bar');  // true
```

在这个块里定义的方法是 _static_,意味着你可以在任何组件实例被创建前运行他们,并且这些方法没有对你组件的  props 或 state 的访问权.如果你在静态方法里检查props的值,把调用者作为参数传入props给静态函数.


### displayName

```javascript
string displayName
```

`displayName` 字符串被用在调试信息.JSX 自动设置这个值；见 [JSX in Depth](/react/docs/jsx-in-depth.html#the-transform).


## Lifecycle Methods

多种方法在组件生命周期的特定点上被执行.


### Mounting: componentWillMount

```javascript
void componentWillMount()
```

被调用一次,即在客户端也在服务端,在最初的渲染发生之前 立即被调用.如果你在这个方法里调用 `setState` , `render()` 将会看到更新的 state 并不论state的变化只执行一次.


### Mounting: componentDidMount

```javascript
void componentDidMount()
```

被调用一次,只在客户端(不在服务端),在最初的渲染发生之后 立即被调用.在生命周期的这个点上,你可以访问任何对你的子级的refs (比如 访问底层的DOM表达).子组件的 `componentDidMount()` 方法在父组件之前被调用.

如果你想与其他 JavaScript 框架整合,用 `setTimeout` 或 `setInterval` 设置timers,或者发送 AJAX 请求,执行这些操作在此方法中.


### Updating: componentWillReceiveProps

```javascript
void componentWillReceiveProps(
  object nextProps
)
```

当一个组件收到新的props时被调用.这个方法不会为最初的渲染调用.

使用它作为响应 prop 转换的时机(在`render()` 被用 `this.setState()` 更新state调用 之前) .旧的 props 可以通过 `this.props` 访问. 在这个函数里调用 `this.setState()` 不会触发任何额外的渲染.

```javascript
componentWillReceiveProps: function(nextProps) {
  this.setState({
    likesIncreasing: nextProps.likeCount > this.props.likeCount
  });
}
```

> 注意:
>
> 并没有类似的 `componentWillReceiveState` 方法. 一个即将到来的 prop 转变可能会导致一个 state 变化,但是反之不是. 如果你需要实现一个对 state 变化相应的操作,使用 `componentWillUpdate`.


### Updating: shouldComponentUpdate

```javascript
boolean shouldComponentUpdate(
  object nextProps, object nextState
)
```

当新的props或者state被收到,在渲染前被调用.这个方法不会在最初的渲染或者 `forceUpdate` 时被调用.

使用此方法作为一个 `return false` 的时机,当你确定新的 props 和 state 的转换不需要组件更新时.

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return nextProps.id !== this.props.id;
}
```

如果 `shouldComponentUpdate` 返回false, `render()` 会在下次state变化前被完全跳过. 另外,`componentWillUpdate` 和 `componentDidUpdate` 将不会被调用.

默认情况下, `shouldComponentUpdate` 总是返回 `true` 来阻止当 `state` 突变时的细微bug,但是如果你仔细的把 `state` 作为不变量对待并只从 `render()`里的 `props` 和 `state`读,你就可以用一个比较旧的props和state与他们的替换者的实现来重写 `shouldComponentUpdate`.

如果性能是瓶颈,尤其是随着成百上千的组件,使用 `shouldComponentUpdate` 来加速你的app.


### Updating: componentWillUpdate

```javascript
void componentWillUpdate(
  object nextProps, object nextState
)
```

当新的props或者state被接受时,在渲染前被立即调用.这个方法不会被初始渲染调用.

使用这个方法作为 在更新发生前执行一些准备 的时机.

> Note:
>
> 你 *不能* 在这个方法里使用 `this.setState()` .如果你需要响应一个prop变化来更新state,使用 `componentWillReceiveProps` 来替代.


### Updating: componentDidUpdate

```javascript
void componentDidUpdate(
  object prevProps, object prevState
)
```

在组件的更新被刷新到DOM后立即被调用.这个方法不会被初始渲染调用.

使用这个方法作为 当组件被更新后在DOM上操作 的时机.


### Unmounting: componentWillUnmount

```javascript
void componentWillUnmount()
```

在组件被从DOM卸载 前 被立即调用.

在这个方法里执行一些必要的清理操作,比如无效化 timers 或者清理任何被 `componentDidMount` 创建的DOM元素.
