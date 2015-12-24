---
id: component-api-zh-CN
title: 组件 API
permalink: component-api-zh-CN.html
prev: top-level-api-zh-CN.html
next: component-specs-zh-CN.html
---

## React.Component

当渲染时，React 组件的实例在 React 内部被创建。这些实例在随后的渲染中被重复使用，并可以在组件方法中通过 `this` 访问。唯一的在 React 之外获取 React 组件实例句柄的方法是保存 `ReactDOM.render` 的返回值。在其它组件内，你可以使用 [refs](/react/docs/more-about-refs-zh-CN.html) 得到相同的结果。


### setState

```javascript
void setState(
  function|object nextState,
  [function callback]
)
```
执行一个 nextState 到当前 state 的浅合并。这是你从事件处理器和服务器请求回调用来触发 UI 更新的主要手段。

第一个参数可以是一个对象（包含0或者多个keys来更新）或者一个（state 和 props的）函数，它返回一个包含要更新的keys的对象。

这里是一个简单的运用:

```javascript
setState({mykey: 'my new value'});
```

也可以以 `function(state, props)` 传递一个函数。当你想要把一个在设置任何值之前参考前一次 state+props 的值的原子更新放在队列中 这会有很用。例如，假如我们想在 state 增加一个值:

```javascript
setState(function(previousState, currentProps) {
  return {myInteger: previousState.myInteger + 1};
});
```

第二个（可选）的参数是一个将会在 `setState` 完成和组件被重绘后执行的回调函数。

> 注意:
>
> *绝对不要* 直接改变 `this.state`，因为之后调用 `setState()` 可能会替换掉你做的改变。把 `this.state` 当做是不可变的。
>
> `setState()` 不会立刻改变 `this.state`，而是创建一个即将处理的 state 转变。在调用该方法之后访问 `this.state` 可能会返回现有的值。
>
> 对 `setState` 的调用没有任何同步性的保证，并且调用可能会为了性能收益批量执行。
>
> `setState()` 将总是触发一次重绘，除非在 `shouldComponentUpdate()` 中实现了条件渲染逻辑。如果可变对象被使用了，但又不能在 `shouldComponentUpdate()` 中实现这种逻辑，仅在新 state 和之前的 state 存在差异的时候调用 `setState()` 可以避免不必要的重新渲染。


### replaceState

```javascript
void replaceState(
  object nextState,
  [function callback]
)
```

类似于 `setState()`，但是删除任何 先前存在但不在 nextState 里的 state 键。

> 注意:
>
> 这个方法在从 `React.Component` 扩展的 ES6 `class` 组件里不可用。它也许会在未来的 React 版本中被完全移除。


### forceUpdate

```javascript
void forceUpdate(
  [function callback]
)
```

默认情况下，当你的组件的 state 或者 props 改变，你的组件将会重绘。然而，如果它们隐式的改变（例如：在对象深处的数据改变了但没有改变对象本身）或者如果你的 `render()` 方法依赖于其他的数据，你可以用调用  `forceUpdate()` 来告诉 React 它需要重新运行 `render()`。

调用 `forceUpdate()` 将会导致 `render()` 跳过 `shouldComponentUpdate()` 在组件上被调用，这会为子级触发正常的生命周期方法。包括每个子级的 `shouldComponentUpdate()` 方法。如果标记改变了，React 仍仅只更新 DOM。

通常你应该试着避免所有对 `forceUpdate()` 的使用并且在 `render()` 里只从 `this.props` 和 `this.state` 读取。这会使你的组件 "纯粹" 并且你的组件会更简单和高效。


### getDOMNode

```javascript
DOMElement getDOMNode()
```

如果这个组件已经被挂载到了 DOM，它返回相应的浏览器原生的 DOM 元素。这个方法对于读取 DOM 的值很有用，比如表单域的值和执行 DOM 的测量。如果 `render` 返回 `null` 或者 `false` 的时候，`this.getDOMNode()` 返回 `null`。

> Note:
>
> getDOMNode 被废弃了，已经被 [ReactDOM.findDOMNode()] 替换(/react/docs/top-level-api-zh-CN.html#reactdom.finddomnode).
>
> 这个方法在从 `React.Component` 扩展的 ES6 `class` 组件里不可用。它也许会在未来的 React 版本中被完全移除。


### isMounted

```javascript
boolean isMounted()
```

如果组件渲染到了 DOM 中，`isMounted()` 返回 true，否则返回 `false`。可以使用该方法来控制对 `setState()` 和 `forceUpdate()` 的异步调用。

> 注意:
>
> 这个方法在从 `React.Component` 扩展的 ES6 `class` 组件里不可用。它也许会在未来的 React 版本中被完全移除,所以你也要移除它 [start migrating away from isMounted() now](/react/blog/2015/12/16/ismounted-antipattern.html)


### setProps

```javascript
void setProps(
  object nextProps,
  [function callback]
)
```

当和一个外部的 JavaScript 应用整合的时候，你也许会想用 `ReactDOM.render()` 给 React 组件标示一个改变。

在根组件上调用 `setProps()` 会改变他的属性并触发一次重绘。另外，你可以提供一个可选的回调函数，一旦 `setProps` 完成并且组件被重绘它就执行。

> 注意:
>
> 这个方法被弃用了并会很快移除.这个方法在从 `React.Component` 扩展的 ES6 `class` 组件里不可用. 取代调用 `setProps`,试着以新的 props 再次调用 `ReactDOM.render()`. 更多的注意事项,见我们的[blog post about using the Top Level API](/react/blog/2015/10/01/react-render-and-top-level-api.html)
>
> 如果可能，上述的在同一个节点上再次调用 `ReactDOM.render()` 的方法是优先替代的。它往往使更新更容易理解。（两种方法并没有显著的性能区别。）
>
> 这个方法仅能在根组件上被调用。也就是说，它仅在直接传给 `ReactDOM.render()` 的组件上可用，在它的子级上不可用。如果你倾向于在子组件上使用 `setProps()`，不要利用响应式更新，而是当子组件在 `render()` 中创建的时候传入新的 prop 到子组件中。

### replaceProps

```javascript
void replaceProps(
  object nextProps,
  [function callback]
)
```

类似于 `setProps()`，但是删除任何先前存在的 props，而不是合并这两个对象。

> 注意:
>
> 这个方法被弃用了并会很快移除.这个方法在从 `React.Component` 扩展的 ES6 `class` 组件里不可用.  取代调用 `replaceProps`,试着以新的 props 再次调用 `ReactDOM.render()`. 更多的注意事项,见我们的[blog post about using the Top Level API](/react/blog/2015/10/01/react-render-and-top-level-api.html)
