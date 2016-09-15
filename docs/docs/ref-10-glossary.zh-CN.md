---
id: glossary-zh-CN
title: React (虚拟) DOM 术语
permalink: docs/glossary-zh-CN.html
prev: webcomponents-zh-CN.html
---

在 React 的术语中,有五个要重点区分的核心类型:

- [ReactElement / ReactElement Factory](#react-elementsreact-元素)
- [ReactNode](#react-nodes)
- [ReactComponent / ReactComponent Class](#react-components)

## React Elements(React 元素)

React里的首要类型是 `ReactElement`.它有四个 properties:`type`, `props`, `key` 和 `ref`.它没有方法,在 prototype 上什么也没有.

你可以通过 `React.createElement` 来创建这些对象.

```javascript
var root = React.createElement('div');
```

要渲染一个新的树到DOM上,你创建 `ReactElement`s 并传递他们到 `ReactDOM.render` 伴随着一个标准的 DOM `Element` (`HTMLElement` 或 `SVGElement`).`ReactElement`s 不要与 DOM `Element`s 混淆.`ReactElement` 是一个轻的,有状态的,不可变的,虚拟的DOM `Element` 的表达.它是一个虚拟 DOM.

```javascript
ReactDOM.render(root, document.getElementById('example'));
```

要给一个DOM元素添加 properties,传递一个properties 对象作为第二个参数,第三个参数传递子级.

```javascript
var child = React.createElement('li', null, 'Text Content');
var root = React.createElement('ul', { className: 'my-list' }, child);
ReactDOM.render(root, document.getElementById('example'));
```

如果你使用 React JSX,这些`ReactElement`s 已经为你创建了.所以 这是等价的:

```javascript
var root = <ul className="my-list">
             <li>Text Content</li>
           </ul>;
ReactDOM.render(root, document.getElementById('example'));
```

### Factories(工厂)

`ReactElement`-工厂 是一个产生特定 `type` property的 `ReactElement` 的函数.React有一个为你内建的辅助工具来创建工厂.它想这样起作用:

```javascript
function createFactory(type) {
  return React.createElement.bind(null, type);
}
```

它允许你创建一个方便的速记 来代替每次输入 `React.createElement('div')` .

```javascript
var div = React.createFactory('div');
var root = div({ className: 'my-div' });
ReactDOM.render(root, document.getElementById('example'));
```

React 已经具备用于常用 HTML tags的内建工厂

```javascript
var root = React.DOM.ul({ className: 'my-list' },
             React.DOM.li(null, 'Text Content')
           );
```

如果你使用JSX 你没有必要使用工厂.JSX已经为创建 `ReactElement`s 提供了一个 方便的速记.


## React Nodes

一个 `ReactNode` 可以是:

- `ReactElement`
- `string` (aka `ReactText`)
- `number` (aka `ReactText`)
- Array of `ReactNode`s (aka `ReactFragment`)

他们被用作其他`ReactElement`s的properties来表示子级.事实上他们创建了一个 `ReactElement`s 的树.


## React Components

你可以使用 React只使用`ReactElement`s 但是要真正利用React,你将要使用 `ReactComponent`s 来创建内嵌 state 的封装.

一个 `ReactComponent` 类就是一个 JavaScript 类 (或者 "constructor function").

```javascript
var MyComponent = React.createClass({
  render: function() {
    ...
  }
});
```

当这个构造函数被调用,期望返回一个至少有一个 `render` 方法的对象.这个对象被称为一个 `ReactComponent`.

```javascript
var component = new MyComponent(props); // never do this
```

与测试不同,你可能通常 *绝不会* 亲自调用这个构造函数.React 为你调用它.

作为替代,你传递 `ReactComponent` 类到 `createElement`,你得到一个 `ReactElement`.

```javascript
var element = React.createElement(MyComponent);
```

或者用 JSX:

```javascript
var element = <MyComponent />;
```

当这个被传给 `ReactDOM.render`,React 会为你调用构造函数并创建一个 `ReactComponent`,返回给你.

```javascript
var component = ReactDOM.render(element, document.getElementById('example'));
```

如果你保持用相同类型的 `ReactElement` 和相同的DOM `Element`容器调用 `ReactDOM.render` ,它总是会返回相同的实例.这个实例是状态化的.

```javascript
var componentA = ReactDOM.render(<MyComponent />, document.getElementById('example'));
var componentB = ReactDOM.render(<MyComponent />, document.getElementById('example'));
componentA === componentB; // true
```

这就是为什么你不应该构造你自己的实例.作为替代,`ReactElement` 在它被构造以前 是一个虚拟的 `ReactComponent`.一个老的和新的`ReactElement` 可以被比较来判断 一个新的 `ReactComponent` 实例是否需要被创建或者已经存在的是否应该被重用.

 `ReactComponent` 的 `render` 方法被期望返回另一个 `ReactElement`.这允许这些组件被结构化.最后,渲染分解为 带着一个 `string` tag的`ReactElement`,它实例化一个 DOM `Element` 实例并把它插入document里.


## Formal Type Definitions

### Entry Point

```
ReactDOM.render = (ReactElement, HTMLElement | SVGElement) => ReactComponent;
```

### Nodes and Elements

```
type ReactNode = ReactElement | ReactFragment | ReactText;

type ReactElement = ReactComponentElement | ReactDOMElement;

type ReactDOMElement = {
  type : string,
  props : {
    children : ReactNodeList,
    className : string,
    etc.
  },
  key : string | boolean | number | null,
  ref : string | null
};

type ReactComponentElement<TProps> = {
  type : ReactClass<TProps>,
  props : TProps,
  key : string | boolean | number | null,
  ref : string | null
};

type ReactFragment = Array<ReactNode | ReactEmpty>;

type ReactNodeList = ReactNode | ReactEmpty;

type ReactText = string | number;

type ReactEmpty = null | undefined | boolean;
```

### Classes and Components

```
type ReactClass<TProps> = (TProps) => ReactComponent<TProps>;

type ReactComponent<TProps> = {
  props : TProps,
  render : () => ReactElement
};
```

