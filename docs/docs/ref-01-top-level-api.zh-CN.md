---
id: top-level-api-zh-CN
title: Top-Level API
permalink: top-level-api-zh-CN.html
next: component-api-zh-CN.html
redirect_from: "/docs/reference-zh-CN.html"
---

## React

`React` 是 React 库的入口点。如果你使用预编译包中的一个，则 `React` 为全局变量；如果你使用 CommonJS 模块，你可以 `require()` 它。


### React.Component

```javascript
class Component
```

当使用ES6 类定义时，React.Component是 React 组件的基类。如何在React中使用 ES6 class 请参见 [可重用组件](/react/docs/reusable-components-zh-CN.html#es6-classes)。基类实际提供了哪些方法 请参见 [组件 API](/react/docs/component-api-zh-CN.html).


### React.createClass

```javascript
ReactClass createClass(object specification)
```

给定一份规格（specification），创建一个组件类。组件通常要实现一个 `render()` 方法，它返回 **单个的** 子级。该子级可能包含任意深度的子级结构。组件与标准原型类的不同之处在于，你不需要对它们调用 new。  它们是为你在后台构造实例（通过 new）的便利的包装器。

更多关于规格对象（specification object）的信息，请见 [组件规格和生命周期](/react/docs/component-specs-zh-CN.html) 。


### React.createElement

```javascript
ReactElement createElement(
  string/ReactClass type,
  [object props],
  [children ...]
)
```

创建并返回一个新的给定类型的 `ReactElement`。type 参数既可以是一个 html 标签名字符串（例如. “div”，“span”，等等），也可以是一个 `ReactClass` （用 `React.createClass` 创建的）。



### React.cloneElement

```
ReactElement cloneElement(
  ReactElement element,
  [object props],
  [children ...]
)
```

使用 `element` 作为起点，克隆并返回一个新的 `ReactElement` 。生成的 element 将会拥有原始 element 的 props 与新的 props 的浅合并。新的子级将会替换现存的子级。 不同于 `React.addons.cloneWithProps`，来自原始 element 的 `key` 和 `ref` 将会保留。对于合并任何 props 没有特别的行为（不同于 `cloneWithProps`）。更多细节详见[v0.13 RC2 blog post](/react/blog/2015/03/03/react-v0.13-rc2.html) 。


### React.createFactory

```javascript
factoryFunction createFactory(
  string/ReactClass type
)
```

返回一个生成给定类型的 ReactElements 的函数。如同 `React.createElement`，type 参数既可以是一个 html 标签名字符串（例如. “div”，“span”，等等），也可以是一个 `ReactClass` 。


### React.isValidElement

```javascript
boolean isValidElement(* object)
```

验证对象是否是一个 ReactElement。


### React.DOM

`React.DOM` 用 `React.createElement` 为 DOM 组件提供了便利的包装器。该方式应该只在不使用 JSX 的时使用。例如，`React.DOM.div(null, 'Hello World!')`。


### React.PropTypes

`React.PropTypes` 包含了能与 组件的`propTypes` 对象一起使用的类型，用以验证传入你的组件的 props。更多有关 `propTypes` 的信息，请见 [可重用组件](/react/docs/reusable-components-zh-CN.html)。


### React.Children

`React.Children` 为处理 `this.props.children` 这个不透明的数据结构提供了工具。

#### React.Children.map

```javascript
array React.Children.map(object children, function fn [, object thisArg])
```

在每一个包含在 `children` 中的直接子级上调用 `fn` ，`fn`中的 `this` 设置为 `thisArg`。如果 `children` 是一个嵌套的对象或者数组，它将被遍历：不会传入容器对象到 `fn` 中。如果 children 是 `null` 或者 `undefined`，则返回 `null` 或者 `undefined` 而不是一个空数组。

#### React.Children.forEach

```javascript
React.Children.forEach(object children, function fn [, object thisArg])
```

类似 `React.Children.map()`，但是不返回数组。

#### React.Children.count

```javascript
number React.Children.count(object children)
```

返回 `children` 中的组件总数，相等于传递给 `map` 或者 `forEach` 的回调函数应被调用次数。

#### React.Children.only

```javascript
object React.Children.only(object children)
```

返回 `children` 中仅有的子级。否则抛出异常。

#### React.Children.toArray

```javascript
array React.Children.toArray(object children)
```

以赋key给每个child的平坦的数组形式,返回不透明的 `children` 数据结构.如果你想操纵你的渲染方法的子级的合集这很有用,尤其如果你想在 `this.props.children` 传下之前渲染或者切割.

## ReactDOM

`react-dom` 包提供了 具体的DOM方法,这些方法可以在你的app的顶层作为一个你需要时脱离React模式的安全舱口 被使用.你的大多数组件不需要使用这个模块.

### ReactDOM.render

```javascript
ReactComponent render(
  ReactElement element,
  DOMElement container,
  [function callback]
)
```

渲染一个 ReactElement 到 DOM 里提供的 `容器（container）`中，并返回一个对 组件(或者返回 `null` 对于 [无状态组件](/react/docs/reusable-components.html#stateless-functions)) 的[引用](/react/docs/more-about-refs.html) 

如果 ReactElement 之前被渲染到了 `container` 中，这将对它执行一次更新，并仅变动需要变动的 DOM 来反映最新的 React 组件。

如果提供了可选的回调函数，则该函数将会在组件渲染或者更新之后被执行。

> 注意:
>
> `ReactDOM.render()` 控制你传入的 container 节点的内容。
>  当初次调用时，任何现存于内的 DOM 元素将被替换。
>  其后的调用使用 React的 diffing 算法来有效率的更新。
>
> `ReactDOM.render()` 不会修改 container 节点（只修改 container 的子级）。
>  将来，也许能够直接插入一个组件到已经存在的 DOM 节点而不覆盖
>  现有的子级。


### ReactDOM.unmountComponentAtNode

```javascript
boolean unmountComponentAtNode(DOMElement container)
```

从 DOM 中移除已经挂载的 React 组件，并清除它的事件处理器和 state。如果在 container 中没有组件被挂载，调用此函数将什么都不做。如果组件被卸载返回 `true`，如果没有组件被卸载返回 `false`。


### ReactDOM.findDOMNode

```javascript
DOMElement findDOMNode(ReactComponent component)
```
如果这个组件已经被挂载到了 DOM，它返回相应的浏览器原生的 DOM 元素。这个方法对于读取 DOM 的值很有用，比如表单域的值和执行 DOM 的测量。**在大多数情况下,你可以连接一个ref到DOM节点上,并避免使用 `findDOMNode`** 如果 `render` 返回 `null` 或者 `false`， `findDOMNode` 返回 `null`.

> 注意:
>
> `findDOMNode()` 是一个用来访问底层DOM节点的安全舱口.大多数情况下,使用这个安全舱口是不被鼓励的,因为它穿破了组件的抽象.
>
> `findDOMNode()` 只在已挂载的组件上工作(即是,已经被放置到DOM里的组件).如果你尝试在没有被挂载的组件上调用这个方法(比如在 一个没有被创建的组件的`render()`里 调用 `findDOMNode()` )会抛出一个异常. 
>
> `findDOMNode()` 不能用在无状态组件.

## ReactDOMServer

`react-dom/server` 允许你在服务器上渲染你的组件.

### ReactDOMServer.renderToString

```javascript
string renderToString(ReactElement element)
```

把 ReactElement 渲染为它原始的 HTML 。这应该仅在服务器端使用。React 将会返回一个 HTML 字符串。你可以用这种方法在服务器端生成 HTML，然后在初始请求下传这些标记，以获得更快的页面加载速度及允许搜索引擎抓取页面（便于 SEO）。

如果在一个在已经有了这种服务器预渲染标记的节点上面调用 `ReactDOM.render()`，React 将会维护该节点，仅绑定事件处理器，让你有一个非常高效的初次加载体验。


### ReactDOMServer.renderToStaticMarkup

```javascript
string renderToStaticMarkup(ReactElement element)
```

类似于 `renderToString` ，除了不创建额外的 DOM 属性，比如 `data-react-id`，这仅在 React 内部使用的属性。如果你想用 React 做一个简单的静态页面生成器，这是很有用的，因为去除额外的属性能够节省很多字节。
